"use strict";
/**
 * MOTORAUTO — logique serveur du jeu (cartes, packs, défis, échanges, concours photo, cartes spéciales).
 * Ce module ne dépend ni de Firebase Functions ni du SDK : il reçoit la base (db), l'horloge et le générateur
 * aléatoire en paramètres, ce qui permet de le tester à sec (tests/game.test.js) et dans le navigateur de test.
 * Chaque gestionnaire reçoit (caller = { uid, name }, data) et renvoie un objet JSON simple, ou lève une erreur { code, message, isGame }.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./game-core"));
  else root.MAGameServer = factory(root.MAGameCore);
})(typeof self !== "undefined" ? self : this, function (core) {
  function GameError(code, message) { const e = new Error(message); e.code = code; e.isGame = true; return e; }
  const fail = (code, msg) => { throw GameError(code, msg); };
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : Number(t) || 0);
  const str = (v, n) => String(v == null ? "" : v).slice(0, n);

  function createGame(deps) {
    const db = deps.db, ts = deps.ts, rng = deps.rng, now = deps.now || Date.now;
    const col = (p) => db.collection(p);
    const MAX_OPEN_TRADES = 5;

    // ---------------------------------------------------------------- catalogue (réduit à identifiant + puissance)
    let poolCache = { at: 0, ids: [] }, autoSig = "";
    async function getPool() {
      if (poolCache.ids.length && now() - poolCache.at < 300000) return poolCache;
      const list = await deps.cardPool();
      if (!list.length) fail("unavailable", "Catalogue indisponible, réessaie dans un instant.");
      const rar = core.computeRarities(list);
      core.circuitRarities().forEach((v, k) => rar.set(k, v));
      const baseOf = new Map(list.map((c) => [c.id, c])), lvs = deps.noCircuits ? [] : core.LIVERIES.filter((r) => baseOf.has(r[1])).map((r) => core.liveryCard(r[0], baseOf.get(r[1])));
      lvs.forEach((c) => rar.set(c.id, c.rar));
      // le site affiche la même rareté que celle utilisée ici (marché, packs) : on la publie quand elle change
      try {
        const auto = {}; list.forEach((c) => { auto[c.id] = rar.get(c.id); });
        const sig = Object.keys(auto).sort().map((k) => k + auto[k][0]).join("").length + ":" + Object.keys(auto).sort().map((k) => k + auto[k]).join("|");
        if (sig !== autoSig) { await col("config").doc("rarityAuto").set({ map: auto, n: list.length }); autoSig = sig; }
      } catch (_) { /* publication facultative */ }
      try { // raretés modifiées à la main par l'admin (config/rarities)
        const ov = await col("config").doc("rarities").get();
        const m = ov.exists ? ov.data().map || {} : {};
        Object.keys(m).forEach((id) => { if (rar.has(id) && core.ORDER.indexOf(m[id]) >= 0) rar.set(id, m[id]); });
      } catch (_) { /* pas de surcharge */ }
      poolCache = { at: now(), list, ids: list.map((c) => c.id).concat(deps.noCircuits ? [] : core.CIRCUIT_CARDS.map((r) => r[0])).concat(lvs.map((c) => c.id)), byId: new Map(list.map((c) => [c.id, c]).concat(Array.from(core.CIRCUIT_BY_ID.entries())).concat(lvs.map((c) => [c.id, c]))), rar };
      // plus ou moins : un modèle = une entrée (les fiches multi-modèles sont éclatées par motorisation, cf. scripts/sync-functions.js)
      const vs = (deps.variants && deps.variants()) || [], vb = new Set(vs.map((v) => v.base));
      poolCache.pmList = list.filter((c) => !vb.has(c.id)).concat(vs);
      poolCache.pmById = new Map(poolCache.byId); vs.forEach((v) => poolCache.pmById.set(v.id, v));
      return poolCache;
    }
    async function specialCard(id) { const s = await col("special_cards").doc(id).get(); return s.exists ? s.data() : null; }
    async function isKnownCard(pool, id) { return pool.byId.has(id) || (core.isSpecial(id) && !!(await specialCard(id))); }

    // ---------------------------------------------------------------- petits utilitaires
    const view = (d) => ({ owned: d.owned, count: d.count, specials: d.specials || 0, circuits: d.circuits || 0, liveries: d.liveries || 0, dust: d.dust, lastPack: d.lastPack, bonus: d.bonus, claimed: d.claimed, opened: d.opened, dustLog: d.dustLog || [], trades: d.trades || 0, chal: d.chal || 0, pics: d.pics || {}, picClaims: d.picClaims || {}, lv: d.lv || {}, mis: d.mis || { day: "", p: {}, done: [] }, offers: d.offers || { day: "", pack: 0, card: 0 }, log: d.log || [], packsAll: d.packsAll || 0, best: d.best || "", welcome: !!d.welcome, bt: d.bt || null, bdDay: d.bdDay || "", dcDay: d.dcDay || "", season: core.seasonOf(d, now()) && d.season, cosm: core.seasonCosm(d, now()), locked: d.locked || {}, hist: d.hist || {}, pity: d.pity || 0, wheelDay: d.wheelDay || "", wheelN: d.wheelN || 0, advent: d.advent || null, offerToday: poolCache.list ? Object.assign({ day: core.dayKey(now()) }, core.dailyOffers(core.dayKey(now()), poolCache.list, poolCache.rar)) : null });
    /** historique des cristaux (40 dernières lignes) : [{t: date, n: variation, w: motif}] */
    function dustMove(d, n, why) {
      if (!n) return;
      d.dust = Math.max(0, Math.min(1000000, d.dust + n));
      d.dustLog = (d.dustLog || []).concat([{ t: now(), n, w: String(why).slice(0, 40) }]).slice(-40);
    }
    /** missions courtes du jour : on avance celles du type donné ; une mission terminée verse ses cristaux tout de suite */
    function bump(d, type, country) {
      const today = core.dayKey(now());
      if (!d.mis || d.mis.day !== today) d.mis = { day: today, p: {}, done: [] };
      let gain = 0; const names = [];
      core.dailyMissions(today).forEach((ms) => {
        if (ms.type !== type || d.mis.done.indexOf(ms.id) >= 0 || (ms.country && ms.country !== country)) return;
        d.mis.p[ms.id] = (d.mis.p[ms.id] || 0) + 1;
        if (d.mis.p[ms.id] >= ms.goal) { d.mis.done.push(ms.id); gain += ms.reward; names.push(ms.label); }
      });
      if (gain) dustMove(d, gain, "Mission du jour");
      return { gain, names };
    }
    function offersOf(d, today) { if (!d.offers || d.offers.day !== today) d.offers = { day: today, pack: 0, card: 0 }; return d.offers; }
    async function readCol(tx, uid) { const s = await tx.get(col("collections").doc(uid)); return s.exists ? Object.assign(core.blankCollection(), s.data()) : core.blankCollection(); }
    function writeCol(tx, uid, d) { core.recount(d); d.claimed = (d.claimed || []).slice(0, 190); d.updatedAt = ts(); tx.set(col("collections").doc(uid), d); }
    const blankWeekly = (wk) => ({ week: wk, packs: 0, dailyDays: [], trades: 0, logs: { duel: 0, share: 0 }, logDay: {}, claimed: [], claimedDaily: [] });
    function normWeekly(s, wk) { const d = s.exists ? s.data() : null; return !d || d.week !== wk ? blankWeekly(wk) : Object.assign(blankWeekly(wk), d); }
    async function readWeekly(tx, uid, wk) { return normWeekly(await tx.get(col("weekly").doc(uid)), wk); }
    function writeWeekly(tx, uid, w) { w.updatedAt = ts(); tx.set(col("weekly").doc(uid), w); }
    async function nameOf(uid) { try { const s = await col("users").doc(uid).get(); return s.exists ? str(s.data().username, 40) || "Pilote" : null; } catch (_) { return null; } }
    async function notify(to, from, text, link, type) {
      try { await col("users/" + to + "/notifications").add({ type: type || "game", fromUid: from.uid || "motorauto", from: str(from.name || "MOTORAUTO", 40), text: str(text, 120), link: link || "#/jouer", read: false, createdAt: ts() }); } catch (_) { /* notification facultative */ }
    }
    async function isMuted(uid) {
      try { const s = await col("mutes").doc(uid).get(); if (!s.exists) return false; const m = s.data(); return m.perma === true || Number(m.untilMs) > now(); } catch (_) { return false; }
    }
    async function requireAdmin(caller) { if (!(await deps.isAdmin(caller))) fail("permission-denied", "Réservé aux administrateurs."); }

    // ---------------------------------------------------------------- statistiques d'un pilote (identiques au calcul du site)
    async function gatherStats(uid, c, total) {
      const s = core.BLANK_STATS();
      const q = (name, field) => col(name).where(field, "==", uid).limit(2000).get().then((r) => r.docs).catch(() => []);
      const [laps, comments, likes, cars, events, rsvps, streak, entries, wins] = await Promise.all([
        col("global_laps").limit(3000).get().then((r) => r.docs).catch(() => []), q("comments", "uid"), q("likes", "uid"), q("community_cars", "uid"),
        q("events", "uid"), q("rsvps", "uid"), col("streaks").doc(uid).get().catch(() => null), q("contest_entries", "uid"), q("contests", "winnerUid")
      ]);
      const byTrack = new Map(), tracks = new Set();
      laps.forEach((d) => {
        const l = d.data(); if (!l.pilotUid) return;
        const k = l.trackKey || String(l.track || "").toLowerCase().trim(); if (!k) return;
        if (l.pilotUid === uid) { s.laps++; tracks.add(k); }
        if (!byTrack.has(k)) byTrack.set(k, new Map());
        const m = byTrack.get(k), ms = Number(l.chronoMs);
        if (ms > 0 && (!m.has(l.pilotUid) || m.get(l.pilotUid) > ms)) m.set(l.pilotUid, ms);
      });
      s.tracks = tracks.size;
      byTrack.forEach((m) => {
        if (m.size < 2) return;
        Array.from(m.entries()).sort((a, b) => a[1] - b[1]).forEach(([id], i) => { if (id === uid) { if (i === 0) s.records++; else if (i < 3) s.podiums++; } });
      });
      s.comments = comments.length; s.likes = likes.length; s.cars = cars.length; s.events = events.length; s.rsvps = rsvps.length;
      if (streak && streak.exists) { const x = streak.data(); s.days = x.days || 0; s.best = Math.max(x.best || 0, x.days || 0); s.last = x.last || ""; }
      s.cards = c.count || 0; s.specials = c.specials || 0; s.trades = c.trades || 0; s.chal = c.chal || 0;
      s.entries = entries.filter((d) => d.data().status === "approved").length; s.wins = wins.length;
      return core.finish(s, total);
    }

    // ---------------------------------------------------------------- collection + packs bonus des badges
    async function syncCollection(caller) {
      const uid = caller.uid, pool = await getPool();
      const snap = await col("collections").doc(uid).get();
      const cur = snap.exists ? Object.assign(core.blankCollection(), snap.data()) : core.blankCollection();
      core.recount(cur);
      const stats = await gatherStats(uid, cur, pool.list.length);
      let fresh = 0;
      const out = await db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        const got = stats.badges.filter((id) => d.claimed.indexOf(id) < 0);
        fresh = got.length;
        if (!snap.exists || got.length) { d.claimed = d.claimed.concat(got); d.bonus += got.length; writeCol(tx, uid, d); }
        return d;
      });
      return { doc: view(out), freshBadges: fresh };
    }

    /** historique des packs : 30 derniers (date, type, meilleure rareté, nombre) + meilleure pioche de tous les temps */
    function packLog(d, kind, cards, today) {
      const rk = (r) => { const i = core.ORDER.indexOf(r); return i < 0 ? 99 : i; };
      let top = null; (cards || []).forEach((c) => { if (!top || rk(c.rarity) < rk(top.rarity)) top = c; });
      if (!top) return;
      d.log = (d.log || []).concat([{ t: today, k: kind, r: top.rarity, id: top.id, n: cards.length }]).slice(-30);
      const cur = String(d.best || "").split("|"), curR = cur[1] || "";
      if (!d.best || rk(top.rarity) < rk(curR)) d.best = top.id + "|" + top.rarity;
      d.packsAll = (d.packsAll || 0) + 1;
    }
    async function openPackCore(caller, data) {
      const uid = caller.uid, kind = data && data.kind;
      if (kind !== "daily" && kind !== "bonus" && kind !== "test" && kind !== "shop") fail("invalid-argument", "Type de pack inconnu.");
      const def = kind === "shop" && core.PACKS[String((data && data.pack) || "world")] ? Object.assign({}, core.PACKS[String((data && data.pack) || "world")]) : null;
      if (kind === "shop" && !def) fail("invalid-argument", "Ce pack n'existe pas.");
      if (kind === "test") await requireAdmin(caller);   // pack de test illimité : réservé à l'administration, sans effet sur les défis ni les compteurs
      const pool = await getPool(), today = core.dayKey(now()), wk = core.weekKey(now());
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), w = await readWeekly(tx, uid, wk);
        if (kind === "daily" && d.lastPack === today) fail("failed-precondition", "Ton pack du jour est déjà ouvert : reviens demain !");
        if (kind === "bonus" && d.bonus < 1) fail("failed-precondition", "Aucun pack bonus disponible.");
        let src = pool.ids;
        let missions = { gain: 0, names: [] }, offerUsed = false;
        if (kind === "shop") {
          if (data.offer === true) {
            const of = core.dailyOffers(today, pool.list, pool.rar), o = offersOf(d, today);
            if (of.pack !== def.id) fail("failed-precondition", "Cette offre n'est plus d'actualité : recharge la page.");
            if (o.pack) fail("failed-precondition", "Tu as déjà profité de cette offre aujourd'hui.");
            def.cost = core.offerPackCost(def.id); o.pack = 1; offerUsed = true;
          }
          if (def.theme) {
            if (data.offer === true) fail("failed-precondition", "Ce pack n'est pas en promotion.");
            if (!core.themePackActive(def.theme, now())) fail("failed-precondition", "Ce pack thématique n'est pas disponible en ce moment.");
            src = pool.ids.filter((id) => !core.isCircuit(id) && !core.isExtra(id) && core.themeMatch(def.theme, pool.byId.get(id)));
            if (src.length < 6) fail("failed-precondition", "Ce pack n'est pas disponible pour l'instant.");
          } else if (def.circuit) src = pool.ids.filter((id) => core.isCircuit(id));
          else if (def.prestige) {
            src = pool.ids.filter((id) => !core.isCircuit(id) && !core.isExtra(id) && core.isPrestige(pool.byId.get(id)));
            if (src.length < 6) fail("failed-precondition", "Ce pack n'est pas disponible pour l'instant.");
          } else if (def.country) {
            src = pool.ids.filter((id) => core.countryOf((pool.byId.get(id) || {}).brand) === def.country);
            if (src.length < 2) fail("failed-precondition", "Ce pack n'est pas disponible pour l'instant.");
          }
          if (d.dust < def.cost) fail("failed-precondition", "Il te faut " + def.cost + " cristaux pour ce pack (tu en as " + d.dust + ").");
          dustMove(d, -def.cost, def.country || def.circuit || def.theme || def.prestige ? def.label + " acheté" : "Pack acheté");
        }
        const ids = kind === "shop" ? core.drawShopPack(pool.rar, src, rng, def.min, def.cards) : core.drawPack(pool.rar, pool.ids, rng, (d.opened + 1) % core.PITY.rare === 0, (d.opened + 1) % core.PITY.epic === 0, (d.pity || 0) + 1 >= core.PITY.legend);
        let dust = 0, bonus = 0;
        d.pics = d.pics || {}; d.picClaims = d.picClaims || {};
        const cards = ids.map((id) => {
          const had = d.owned[id] || 0, rar = pool.rar.get(id), keys = (pool.byId.get(id) || {}).pics || [];
          if (had > 0 && keys.length > 1) {
            // carte déjà possédée à plusieurs images : on débloque une image qu'elle n'a pas encore (ce n'est pas un doublon)
            const have = core.picsHave(d, id, keys), missing = keys.filter((k) => have.indexOf(k) < 0);
            if (missing.length) {
              const pick = missing[Math.floor(rng() * missing.length)];
              d.pics[id] = have.concat(pick);
              const rw = core.picReward(rar, d.pics[id].length, keys.length, d.picClaims[id]);
              d.picClaims[id] = rw.mask; bonus += rw.gain;
              return { id, fresh: false, rarity: rar, newPic: pick, picN: d.pics[id].length, picTotal: keys.length, reward: rw.gain };
            }
          }
          d.owned[id] = had + 1; core.histAdd(d, id, kind === "shop" ? "shop" : kind, now());
          if (had === 0 && keys.length) d.pics[id] = [keys[0]];
          if (had > 0) dust += core.RAR[rar].dust;
          return { id, fresh: had === 0, rarity: rar, picTotal: keys.length };
        });
        if (bonus) dustMove(d, bonus, "Collection d'images");
        if (dust) dustMove(d, dust, kind === "shop" ? "Doublons du pack acheté" : "Doublons");
        if (kind !== "test") {
          const m1 = bump(d, "open"), m2 = kind === "shop" ? bump(d, "shop", def.circuit ? "world" : def.country || "world") : { gain: 0, names: [] }, m3 = offerUsed ? bump(d, "offer") : { gain: 0, names: [] };
          missions = { gain: m1.gain + m2.gain + m3.gain, names: m1.names.concat(m2.names, m3.names) };
        }
        if (kind === "daily" || kind === "bonus") d.pity = cards.some((c) => c.rarity === "legendary" || c.rarity === "shiny" || c.rarity === "mythic") ? 0 : (d.pity || 0) + 1;
        if (kind !== "test") packLog(d, kind, cards, today);
        // défis de la semaine : cartes épiques ou mieux piochées, packs thématiques / Prestige ouverts
        let weeklyTouched = false;
        if (kind !== "test") {
          w.logs = w.logs || {};
          const hi = cards.filter((c) => c.rarity === "epic" || c.rarity === "legendary" || c.rarity === "shiny").length;
          if (hi) { w.logs.epic = (w.logs.epic || 0) + hi; weeklyTouched = true; }
          if (kind === "shop" && (def.theme || def.prestige)) { w.logs.theme = (w.logs.theme || 0) + 1; weeklyTouched = true; const m4 = bump(d, "prestige"); if (m4.gain) { missions.gain += m4.gain; missions.names = missions.names.concat(m4.names); } }
        }
        if (kind !== "test") { core.seasonAdd(d, core.SEASON_PTS.pack, { packs: 1 }, now()); }
        if (kind === "shop") { writeCol(tx, uid, d); if (weeklyTouched) writeWeekly(tx, uid, w); return { cards, dust, bonus, missions, doc: view(d) }; }   // n'entre ni dans les packs ouverts, ni dans les défis
        if (kind === "test") { core.recount(d); writeCol(tx, uid, d); return { cards, dust, bonus, doc: view(d), test: true }; }
        if (kind === "daily") { d.lastPack = today; if (w.dailyDays.indexOf(today) < 0) w.dailyDays.push(today); } else d.bonus--;
        d.opened++; w.packs++;
        writeCol(tx, uid, d); writeWeekly(tx, uid, w);
        return { cards, dust, bonus, missions, doc: view(d) };
      });
    }

    async function craftCard(caller, data) {
      const uid = caller.uid, id = str(data && data.id, 90), pool = await getPool(), today = core.dayKey(now());
      if (!pool.byId.has(id)) fail("not-found", "Cette carte n'existe pas.");
      const rar = pool.rar.get(id);
      if (rar === "mythic") fail("failed-precondition", "Une carte Légende se gagne en complétant un album : elle ne se fabrique pas.");
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        let cost = core.RAR[rar].craft, offerUsed = false;
        if (data && data.offer === true) {
          const of = core.dailyOffers(today, pool.list, pool.rar), o = offersOf(d, today);
          if (of.card !== id) fail("failed-precondition", "Cette offre n'est plus d'actualité : recharge la page.");
          if (o.card) fail("failed-precondition", "Tu as déjà profité de cette offre aujourd'hui.");
          cost = of.cardCost; o.card = 1; offerUsed = true;
        }
        if ((d.owned[id] || 0) > 0) fail("failed-precondition", "Tu possèdes déjà cette carte.");
        if (d.dust < cost) fail("failed-precondition", "Il te faut " + cost + " cristaux (tu en as " + d.dust + ").");
        dustMove(d, -cost, offerUsed ? "Carte du jour achetée" : "Carte fabriquée"); d.owned[id] = 1; core.histAdd(d, id, offerUsed ? "offer" : "craft", now());
        const missions = offerUsed ? bump(d, "offer") : { gain: 0, names: [] };
        core.seasonAdd(d, core.SEASON_PTS.craft, null, now());
        writeCol(tx, uid, d);
        return { id, missions, doc: view(d) };
      });
    }

    /** améliore une carte possédée (niveau 1 à 5 : cadre et effets plus beaux) contre des cristaux */
    async function upgradeCard(caller, data) {
      const uid = caller.uid, id = str(data && data.id, 90), pool = await getPool();
      if (!(await isKnownCard(pool, id))) fail("not-found", "Cette carte n'existe pas.");
      const rar = core.isSpecial(id) ? "special" : pool.rar.get(id);
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if ((d.owned[id] || 0) < 1) fail("failed-precondition", "Tu ne possèdes pas cette carte.");
        d.lv = d.lv || {};
        const cur = d.lv[id] || 1;
        if (cur >= core.LV_MAX) fail("failed-precondition", "Cette carte est déjà au niveau maximum.");
        const cost = core.upgradeCost(rar, cur + 1);
        if (d.dust < cost) fail("failed-precondition", "Il te faut " + cost + " cristaux (tu en as " + d.dust + ").");
        dustMove(d, -cost, "Carte améliorée"); d.lv[id] = cur + 1;
        const missions = bump(d, "upgrade");
        core.seasonAdd(d, core.SEASON_PTS.upgrade, null, now());
        writeCol(tx, uid, d);
        return { id, level: cur + 1, cost, missions, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- sets de cartes complétés → cristaux + badge de set
    async function claimSetsCore(caller) {
      const uid = caller.uid, pool = await getPool(), sets = core.setsOf(pool.list);
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), ref = col("set_claims").doc(uid), cs = await tx.get(ref), done = cs.exists ? Object.assign({}, cs.data().done || {}) : {};
        const w = await readWeekly(tx, uid, core.weekKey(now()));
        const won = [], legends = [];
        sets.forEach((st) => {
          if (done[st.id] || !st.ids.every((id) => (d.owned[id] || 0) > 0)) return;
          done[st.id] = now(); won.push({ id: st.id, name: st.name, reward: st.reward, legend: st.legend || "" });
          if (st.legend && pool.byId.has(st.legend)) {
            if ((d.owned[st.legend] || 0) > 0) dustMove(d, core.RAR.mythic.dust, "Légende déjà possédée");
            else { d.owned[st.legend] = 1; core.histAdd(d, st.legend, "album", now()); legends.push(st.legend); }
          }
        });
        if (!won.length) return { claimed: [], legends: [], doc: view(d), done };
        const total = won.reduce((t, w) => t + w.reward, 0);
        dustMove(d, total, "Album complété"); core.seasonAdd(d, core.SEASON_PTS.album * won.length, null, now(), true); writeCol(tx, uid, d);
        w.logs = w.logs || {}; w.logs.album = (w.logs.album || 0) + won.length; writeWeekly(tx, uid, w);
        tx.set(ref, { done, updatedAt: ts() });
        return { claimed: won, legends, total, doc: view(d), done };
      });
    }

    // ---------------------------------------------------------------- série de visites
    async function touchStreak(caller) {
      const uid = caller.uid, today = core.dayKey(now()), yesterday = core.dayKey(now() - 86400000), month = core.monthKey(now());
      return db.runTransaction(async (tx) => {
        const ref = col("streaks").doc(uid), s = await tx.get(ref), cur = s.exists ? s.data() : null, d = await readCol(tx, uid);
        let freezes = Math.max(0, Math.min(core.FREEZE_MAX, (cur && cur.freezes) || 0)), fzMonth = (cur && cur.fzMonth) || "";
        if (fzMonth !== month) { fzMonth = month; if (freezes < core.FREEZE_MAX) freezes++; }     // 1 gel offert par mois
        if (cur && cur.last === today) {
          if (freezes !== ((cur && cur.freezes) || 0) || fzMonth !== (cur.fzMonth || "")) tx.set(ref, Object.assign({}, cur, { freezes, fzMonth, updatedAt: ts() }));
          return { days: cur.days || 1, best: Math.max(cur.best || 0, cur.days || 1), fresh: false, freezes, saved: 0 };
        }
        let days, saved = 0;
        if (cur && cur.last === yesterday) days = (cur.days || 0) + 1;
        else if (cur && cur.last) {
          const missed = core.dayDiff(cur.last, today) - 1;       // jours entièrement ratés
          if (missed > 0 && missed <= freezes) { freezes -= missed; saved = missed; days = (cur.days || 0) + 1; }
          else days = 1;
        } else days = 1;
        const best = Math.max(days, (cur && cur.best) || 0);
        tx.set(ref, { days, best, last: today, freezes, fzMonth, updatedAt: ts() });
        const sn = core.seasonOf(d, now());
        if (sn.dayLog !== today) { sn.dayLog = today; core.seasonAdd(d, core.SEASON_PTS.visit, { days: 1 }, now(), true); writeCol(tx, uid, d); }
        return { days, best, fresh: true, freezes, saved, doc: view(d) };
      });
    }
    /** achat d'un gel de série en cristaux (2 gels en stock au maximum) */
    async function buyFreeze(caller) {
      const uid = caller.uid;
      return db.runTransaction(async (tx) => {
        const ref = col("streaks").doc(uid), s = await tx.get(ref), cur = s.exists ? s.data() : { days: 0, best: 0, last: "" }, d = await readCol(tx, uid);
        const freezes = cur.freezes || 0;
        if (freezes >= core.FREEZE_MAX) fail("failed-precondition", "Tu as déjà " + core.FREEZE_MAX + " gels en stock.");
        if (d.dust < core.FREEZE_COST) fail("failed-precondition", "Il te faut " + core.FREEZE_COST + " cristaux (tu en as " + d.dust + ").");
        dustMove(d, -core.FREEZE_COST, "Gel de série");
        tx.set(ref, Object.assign({}, cur, { freezes: freezes + 1, updatedAt: ts() }));
        writeCol(tx, uid, d);
        return { freezes: freezes + 1, doc: view(d) };
      });
    }
    /** récupération d'un palier du pass ou d'une étape de quête de saison */
    async function seasonClaim(caller, data) {
      const uid = caller.uid, what = data && data.what, poolForClaim = () => getPool();
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), sn = core.seasonOf(d, now());
        let text = "", cards = [];
        if (what === "tier") {
          const t = Number(data.tier) | 0;
          if (t < 1 || t > core.PASS_TIERS) fail("invalid-argument", "Palier inconnu.");
          if (core.passTier(sn) < t) fail("failed-precondition", "Palier pas encore atteint.");
          if (sn.claimed.indexOf(t) >= 0) fail("failed-precondition", "Palier déjà récupéré.");
          const r = core.passReward(t), pool = (r.epic || r.choice) ? await poolForClaim() : null, extra = [];
          if (r.choice) {
            const offer = core.legendOffer(pool.ids.filter((x) => !core.isExtra(x)), pool.rar, d.owned, uid, sn.n), pick = String((data && data.pick) || "");
            if (!pick) return { need: "pick", offer, doc: view(d) };
            if (offer.indexOf(pick) < 0) fail("invalid-argument", "Cette carte ne fait pas partie de ton choix.");
            d.owned[pick] = (d.owned[pick] || 0) + 1; core.histAdd(d, pick, "pass", now()); extra.push(pick);
          }
          if (r.circuit) { const id = core.circuitPick(pool.rar, d.owned, uid, sn.n, t); if (id) { d.owned[id] = (d.owned[id] || 0) + 1; core.histAdd(d, id, "pass", now()); extra.push(id); } }
          if (r.epic) { const id = core.epicPick(pool.ids.filter((x) => !core.isExtra(x)), pool.rar, d.owned, uid, sn.n, t); if (id) { d.owned[id] = (d.owned[id] || 0) + 1; core.histAdd(d, id, "pass", now()); extra.push(id); } }
          sn.claimed.push(t);
          let dust = r.dust, fz = null;
          if (r.freeze) {
            const sref = col("streaks").doc(uid), ss = await tx.get(sref), cur = ss.exists ? ss.data() : { days: 0, best: 0, last: "" };
            if ((cur.freezes || 0) < core.FREEZE_MAX) { fz = { ref: sref, cur }; } else dust += 75;        // stock plein : remplacé par des cristaux
          }
          if (dust) dustMove(d, dust, "Pass de saison");
          if (fz) tx.set(fz.ref, Object.assign({}, fz.cur, { freezes: (fz.cur.freezes || 0) + 1, updatedAt: ts() }));
          if (r.bonus) d.bonus = (d.bonus || 0) + r.bonus;
          if (r.frame) core.grantVariant(d.cosm, "f", r.frame);      // saison suivante : version « II », « III »…
          if (r.title) core.grantVariant(d.cosm, "t", r.title);
          text = core.passLabel(r, d.cosm, true);
          cards = extra;
        } else if (what === "quest") {
          const qs = core.questState(sn), qlist = core.questList(sn.rk);
          if (qs.done) fail("failed-precondition", "Toutes les quêtes sont terminées.");
          if (!qs.ready) fail("failed-precondition", "Objectif pas encore atteint.");
          dustMove(d, qs.quest.dust, "Quête de saison");
          text = qs.quest.dust + " cristaux";
          sn.base = Object.assign({}, sn.act);          // l'étape suivante repart de zéro
          sn.q++;
          if (sn.q >= qlist.length) {
            const f = core.SEASON_QUEST_FINAL; dustMove(d, f.dust, "Quête de saison : récompense finale");
            core.grantVariant(d.cosm, "f", f.frame); core.grantVariant(d.cosm, "t", f.title);
            text += " + récompense finale exclusive (cadre et titre)";
          }
        } else fail("invalid-argument", "Demande inconnue.");
        if (!sn.ecl && sn.claimed.indexOf(core.PASS_TIERS) >= 0 && sn.q >= core.questList(sn.rk).length) { sn.ecl = true; core.grantVariant(d.cosm, "f", "s_eclipse"); text += " + cadre rare « Éclipse »"; }
        writeCol(tx, uid, d);
        return { text, cards, doc: view(d) };
      });
    }
    // ---------------------------------------------------------------- roue quotidienne et calendrier de l'Avent
    async function giveFreezeTx(tx, uid, pre) {
      const ref = col("streaks").doc(uid), cur = pre.exists ? pre.data() : { days: 0, best: 0, last: "" };
      if ((cur.freezes || 0) >= core.FREEZE_MAX) return false;
      tx.set(ref, Object.assign({}, cur, { freezes: (cur.freezes || 0) + 1, updatedAt: ts() })); return true;
    }
    async function gameSettings() { try { const s = await col("config").doc("gameSettings").get(); return s.exists ? s.data() : {}; } catch (_) { return {}; } }
    async function spinWheel(caller) {
      if ((await gameSettings()).wheel === false) fail("failed-precondition", "La roue est en pause pour le moment.");
      const uid = caller.uid, today = core.dayKey(now()), pool = await getPool();
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), ss = await tx.get(col("streaks").doc(uid));
        if (d.wheelDay === today) fail("failed-precondition", "Tu as déjà tourné la roue aujourd'hui. Reviens à minuit !");
        const res = core.wheelDraw(rng); let text = core.wheelLabel(res), cardId = "", fell = 0;
        if (res.k === "dust") dustMove(d, res.n, "Roue du jour");
        else if (res.k === "pack") d.bonus = (d.bonus || 0) + 1;
        else if (res.k === "freeze") { if (!(await giveFreezeTx(tx, uid, ss))) { fell = 50; dustMove(d, fell, "Roue du jour"); text = "50 cristaux (stock de gels plein)"; } }
        else if (res.k === "pts") core.seasonAdd(d, res.n, null, now(), true);
        else {
          const all = pool.ids.filter((id) => pool.rar.get(id) === res.rarity).sort(), fresh = all.filter((id) => !(d.owned[id] > 0)), from = fresh.length ? fresh : all;
          if (from.length) { cardId = from[Math.floor(rng() * from.length) % from.length]; d.owned[cardId] = (d.owned[cardId] || 0) + 1; core.histAdd(d, cardId, "wheel", now()); }
          else { dustMove(d, 100, "Roue du jour"); text = "100 cristaux"; }
        }
        d.wheelDay = today; d.wheelN = (d.wheelN || 0) + 1;
        writeCol(tx, uid, d);
        return { prize: Object.assign({ text, cardId }, res), doc: view(d) };
      });
    }
    async function openAdvent(caller, data) {
      if ((await gameSettings()).advent === false) fail("failed-precondition", "Le calendrier de l'Avent est en pause pour le moment.");
      const uid = caller.uid, at = core.adventToday(now()), n = Math.floor(Number(data && data.day));
      if (!at) fail("failed-precondition", "Le calendrier de l'Avent ouvre le 1er décembre.");
      if (!(n >= 1 && n <= 24)) fail("invalid-argument", "Case inconnue.");
      if (n > at.d) fail("failed-precondition", "Cette case ouvre le " + n + " décembre.");
      const reward = core.adventReward(n), cid = "sp-noel-" + at.y;
      if (reward.card) {
        const sref = col("special_cards").doc(cid), cs = await sref.get();
        if (!cs.exists) await sref.set({ name: "Carte de Noël " + at.y, edition: "Calendrier de l'Avent " + at.y, image: "", images: [], text: "Offerte aux pilotes qui ont ouvert la dernière case du calendrier de l'Avent.", supply: 0, granted: 0, active: true, kind: "advent", color: "gold", createdAt: ts() });
      }
      const out = await db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), ss = await tx.get(col("streaks").doc(uid));
        const av = d.advent && d.advent.y === at.y ? d.advent : { y: at.y, o: [] };
        if (av.o.indexOf(n) >= 0) fail("already-exists", "Case déjà ouverte.");
        av.o = av.o.concat([n]); d.advent = av;
        if (reward.dust) dustMove(d, reward.dust, "Avent, case " + n);
        if (reward.bonus) d.bonus = (d.bonus || 0) + reward.bonus;
        let fz = reward.freeze ? await giveFreezeTx(tx, uid, ss) : true;
        if (reward.freeze && !fz) dustMove(d, 75, "Avent, case " + n);
        if (reward.pts) core.seasonAdd(d, reward.pts, null, now(), true);
        writeCol(tx, uid, d);
        return { reward, doc: view(d) };
      });
      if (reward.card) await adminGrantCard({ uid: "system", system: true }, { uid, cardId: cid, qty: 1 }).catch(() => {});
      return Object.assign(out, { text: core.adventLabel(reward) });
    }

    /** pack de bienvenue : une seule fois par compte */
    // ---------------------------------------------------------------- fil d'actualité : les beaux tirages et les albums complétés
    async function feedPost(uid, text, link) {
      try {
        const u = await col("users").doc(uid).get(), p = u.exists ? u.data() : {};
        await col("feed").add({ type: "game", uid, pilot: str(p.username, 40) || "Pilote", avatar: str(p.avatar, 500), text: str(text, 160), link: str(link, 200), createdAt: ts() });
      } catch (_) { /* le fil est facultatif : un échec ne doit jamais gêner le jeu */ }
    }
    async function openPack(caller, data) {
      const r = await openPackCore(caller, data);
      try {
        if (!r.test && r.cards) {
          const top = r.cards.filter((c) => ["legendary", "shiny", "mythic"].indexOf(c.rarity) >= 0)[0];
          if (top) { const pool = await getPool(), car = pool.byId.get(top.id); await feedPost(caller.uid, "a tiré " + (car ? (car.brand ? car.brand + " " : "") + String(car.model || car.name || "").replace(/\s*\(.*$/, "") : "une carte") + " (" + core.RAR[top.rarity].label + ") dans un pack !", "#/voiture/" + encodeURIComponent(top.id)); }
        }
      } catch (_) { /* facultatif */ }
      return r;
    }
    async function claimSets(caller) {
      const r = await claimSetsCore(caller);
      if (r && r.claimed && r.claimed.length) await feedPost(caller.uid, r.claimed.length === 1 ? "a complété l'album « " + r.claimed[0].name + " » !" : "a complété " + r.claimed.length + " albums d'un coup !", "#/jouer/collection");
      return r;
    }
    /** carte du jour offerte : une carte COMMUNE gratuite par jour, de préférence une que le joueur n'a pas encore */
    async function claimDayCard(caller) {
      const uid = caller.uid, today = core.dayKey(now()), pool = await getPool();
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if (d.dcDay === today) fail("failed-precondition", "Ta carte offerte du jour est déjà récupérée : reviens demain !");
        const all = pool.ids.filter((id) => pool.rar.get(id) === "common" && !core.isCircuit(id) && !core.isExtra(id) && !core.isSpecial(id)).sort();
        if (!all.length) fail("failed-precondition", "Aucune carte disponible pour l'instant.");
        const fresh = all.filter((id) => !(d.owned[id] > 0)), list = fresh.length ? fresh : all;
        const id = list[core.hashStr("daycard-" + uid + "-" + today) % list.length];
        const had = d.owned[id] || 0;
        d.owned[id] = had + 1; d.dcDay = today; core.histAdd(d, id, "gift", now());
        let dust = 0; if (had > 0) { dust = core.RAR.common.dust; dustMove(d, dust, "Carte du jour offerte (doublon)"); }
        writeCol(tx, uid, d);
        return { card: { id, fresh: had === 0, dust }, doc: view(d) };
      });
    }
    async function claimWelcome(caller) {
      const uid = caller.uid;
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if (d.welcome) fail("failed-precondition", "Le cadeau de bienvenue a déjà été récupéré.");
        d.welcome = true; d.bonus = (d.bonus || 0) + core.WELCOME.bonus; dustMove(d, core.WELCOME.dust, "Cadeau de bienvenue");
        writeCol(tx, uid, d);
        return { doc: view(d) };
      });
    }


    // ---------------------------------------------------------------- batailles contre l'IA : historique, trophées, défi du jour
    const BT_DAILY_DUST = 40, BT_KEEP = 15, BT_DAY_MAX = 40;
    const btBlank = () => ({ w: 0, l: 0, t: 0, streak: 0, best: 0, flawless: 0, giant: 0, day: "", n: 0, dStart: 0, last: [] });
    /** le joueur lance le défi quotidien : l'heure de départ est notée côté serveur (une partie ne peut pas être « terminée » avant 20 s) */
    async function battleDailyStart(caller) {
      const uid = caller.uid, today = core.dayKey(now());
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if (d.bdDay === today) fail("failed-precondition", "Tu as déjà relevé le défi du jour. Reviens demain !");
        d.bt = Object.assign(btBlank(), d.bt || {}); d.bt.dStart = now();
        writeCol(tx, uid, d);
        return { ok: true, dust: BT_DAILY_DUST };
      });
    }
    /** une bataille contre l'IA est terminée : historique, séries, trophées (5-0, 10 victoires d'affilée, victoire d'une commune) et récompense fixe du défi du jour */
    async function battleReport(caller, data) {
      const uid = caller.uid, today = core.dayKey(now()), q = data || {};
      const num = (v) => Math.max(0, Math.min(5, Math.floor(Number(v) || 0)));
      const me = num(q.me), ai = num(q.ai), res = me > ai ? "w" : me < ai ? "l" : "t";
      if (me + ai > 5) fail("invalid-argument", "Score impossible.");
      const level = ["easy", "normal", "hard"].indexOf(q.level) >= 0 ? q.level : "normal", daily = q.daily === true;
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), bt = Object.assign(btBlank(), d.bt || {});
        if (bt.day !== today) { bt.day = today; bt.n = 0; }
        if (bt.n >= BT_DAY_MAX) fail("resource-exhausted", "Beaucoup de batailles aujourd'hui, reviens demain pour les compter.");
        bt.n++; bt[res]++;
        if (res === "w") { bt.streak++; if (bt.streak > bt.best) bt.best = bt.streak; } else if (res === "l") bt.streak = 0;
        const trophies = [];
        if (res === "w" && me === 5 && ai === 0) { bt.flawless++; trophies.push("flawless"); }
        if (res === "w" && bt.streak === 10) trophies.push("streak10");
        if (q.giant === true && me > ai) { bt.giant++; trophies.push("giant"); }
        let reward = 0;
        if (daily) {
          const ok = bt.dStart && now() - bt.dStart >= 20000 && now() - bt.dStart <= 2 * 3600 * 1000 && d.bdDay !== today;
          if (ok) { d.bdDay = today; bt.dStart = 0; if (res === "w") { reward = BT_DAILY_DUST; dustMove(d, reward, "Défi bataille du jour"); } }
        }
        bt.last = [{ t: now(), lv: level, r: res, me, ai, dl: daily ? 1 : 0 }].concat(bt.last || []).slice(0, BT_KEEP);
        d.bt = bt; writeCol(tx, uid, d);
        return { doc: view(d), reward, trophies };
      });
    }

    // ---------------------------------------------------------------- défi de clubs de la semaine
    const CLASH_PRIZE = 60;
    const mix = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    async function clubClash(caller) {
      const wk = core.weekKey(now()), prev = core.weekKey(now() - 7 * 86400000);
      const [cs, ms] = await Promise.all([col("clubs").limit(300).get(), col("club_members").limit(3000).get()]);
      const byClub = new Map(); ms.forEach((m) => { const x = m.data(); if (!byClub.has(x.clubId)) byClub.set(x.clubId, []); byClub.get(x.clubId).push(x.uid); });
      const clubs = []; cs.forEach((c) => { const n = (byClub.get(c.id) || []).length; if (n >= 2) clubs.push({ id: c.id, name: String(c.data().name || c.id).slice(0, 40), n }); });
      // 1) appariement de la semaine : clubs de taille proche, créé une seule fois
      const ref = col("club_clash").doc(wk);
      await db.runTransaction(async (tx) => {
        const s = await tx.get(ref); if (s.exists) return;
        const order = clubs.slice().sort((a, b) => a.n - b.n || mix(wk + a.id) - mix(wk + b.id)), pairs = [];
        for (let i = 0; i + 1 < order.length; i += 2) pairs.push({ a: order[i].id, b: order[i + 1].id, an: order[i].name, bn: order[i + 1].name });
        tx.set(ref, { week: wk, pairs, done: false, createdAt: ts() });
      });
      // 2) clôture de la semaine précédente : points cumulés des membres, récompense aux membres actifs du club gagnant
      const pref = col("club_clash").doc(prev), psnap = await pref.get();
      if (psnap.exists && !psnap.data().done) {
        const claimed = await db.runTransaction(async (tx) => { const s = await tx.get(pref); if (!s.exists || s.data().done) return null; tx.update(pref, { done: true }); return s.data(); });
        if (claimed) {
          const results = [];
          for (const p of claimed.pairs || []) {
            const score = async (cid) => { let t = 0; const act = []; for (const uid of (byClub.get(cid) || []).slice(0, 60)) { const s = await col("collections").doc(uid).get(); const w = s.exists && s.data().wpts; const v = w && w.w === prev ? w.p || 0 : 0; t += v; if (v > 0) act.push(uid); } return { t, act }; };
            const A = await score(p.a), B = await score(p.b);
            const win = A.t === B.t ? "" : A.t > B.t ? p.a : p.b, act = win === p.a ? A.act : win === p.b ? B.act : [];
            results.push({ a: p.a, b: p.b, an: p.an, bn: p.bn, as: A.t, bs: B.t, win });
            for (const uid of act) {
              await db.runTransaction(async (tx) => { const d = await readCol(tx, uid); if (d.cosm.indexOf("t:clubwin") < 0) d.cosm.push("t:clubwin"); dustMove(d, CLASH_PRIZE, "Défi de clubs"); writeCol(tx, uid, d); });
            }
          }
          await pref.update({ results });
        }
      }
      const cur = (await ref.get()).data() || {}, last = (await pref.get()).data() || {};
      return { week: wk, pairs: cur.pairs || [], prev: { week: prev, results: last.results || [] }, prize: CLASH_PRIZE };
    }

    // ---------------------------------------------------------------- défis de la semaine
    const LOGS = ["duel", "share", "featview"];
    async function logAction(caller, data) {
      const type = data && data.type, uid = caller.uid, today = core.dayKey(now()), wk = core.weekKey(now());
      if (LOGS.indexOf(type) < 0) fail("invalid-argument", "Action inconnue.");
      if (type === "featview" && str(data.carId, 90) !== (await featuredCarId(wk))) return { counted: false };   // seule la fiche mise en avant compte
      return db.runTransaction(async (tx) => {
        const w = await readWeekly(tx, uid, wk), cur = w.logDay[type] || { day: "", n: 0 };
        const n = cur.day === today ? cur.n : 0;
        if (n >= 3) return { counted: false };
        w.logDay[type] = { day: today, n: n + 1 }; w.logs[type] = (w.logs[type] || 0) + 1;
        writeWeekly(tx, uid, w);
        return { counted: true };
      });
    }
    /** voiture mise en avant d'une semaine : choix de l'admin (site_settings/featured.weeks[semaine]) sinon tirage automatique */
    async function featuredCarId(wk) {
      const pool = await getPool();
      try { const s = await col("site_settings").doc("featured").get(); const id = s.exists && s.data().weeks && s.data().weeks[wk]; if (id && pool.byId.has(id)) return id; } catch (_) { /* tirage automatique */ }
      return core.autoFeatured(wk, pool.ids.filter((x) => !core.isExtra(x)));
    }
    async function featuredInfo(wk) {
      const pool = await getPool(), id = await featuredCarId(wk), c = pool.byId.get(id) || {};
      return { id, name: str(c.name || [c.brand, c.model].filter(Boolean).join(" ") || id, 80), image: str(c.image || c.img || "", 400) };
    }
    /** valeurs des 3 défis « voiture de la semaine » */
    async function featValues(uid, carId, w, start) {
      const exists = (name) => col(name).doc("cat_" + carId + "_" + uid).get().then((x) => x.exists && tsMs(x.data().createdAt) >= start).catch(() => false);
      const [lk, rc, cm] = await Promise.all([exists("likes"), exists("reactions"),
        col("comments").where("uid", "==", uid).limit(500).get().then((r) => r.docs.some((d) => d.data().target === carId && d.data().kind === "cat" && tsMs(d.data().createdAt) >= start)).catch(() => false)]);
      return { "f-react": lk || rc ? 1 : 0, "f-comment": cm ? 1 : 0, "f-view": (w.logs && w.logs.featview) ? 1 : 0 };
    }
    async function countSince(name, field, uid, start, tsField) {
      let r; try { r = await col(name).where(field, "==", uid).limit(500).get(); } catch (_) { return 0; }
      return r.docs.filter((d) => tsMs(d.data()[tsField || "createdAt"]) >= start).length;
    }
    /** valeurs des défis fondés sur les données du site (le reste vient du compteur hebdomadaire) */
    async function queryValues(uid, items, since) {
      // une requête par source (pas par défi) et toutes en parallèle : le statut des défis ne dépend plus du nombre de défis
      const start = since != null ? since : core.weekStart(now()), out = {}, bySrc = new Map();
      const run = (src) => {
        if (src === "q:comments") return countSince("comments", "uid", uid, start);
        if (src === "q:laps") return countSince("global_laps", "pilotUid", uid, start);
        if (src === "q:likes") return countSince("likes", "uid", uid, start);
        if (src === "q:reacts") return countSince("reactions", "uid", uid, start);
        if (src === "q:chat") return countSince("global_chat", "uid", uid, start, "timestamp");
        if (src === "q:rsvps") return countSince("rsvps", "uid", uid, start);
        if (src === "q:votes") return countSince("contest_votes", "uid", uid, start);
        if (src === "state:wish") return col("wishlists").doc(uid).get().then((s) => (s.exists && Array.isArray(s.data().ids) ? s.data().ids.length : 0));
        return null;
      };
      items.forEach((ch) => { if (!bySrc.has(ch.src)) { const p = run(ch.src); if (p) bySrc.set(ch.src, p); } });
      const keys = Array.from(bySrc.keys()), vals = await Promise.all(keys.map((k) => bySrc.get(k)));
      const res = new Map(keys.map((k, i) => [k, vals[i]]));
      items.forEach((ch) => { if (res.has(ch.src)) out[ch.id] = res.get(ch.src); });
      return out;
    }
    function valueOf(ch, w, qv, daily) {
      const p = ch.src.split(":"), k = p[1];
      if (daily) {
        const today = core.dayKey(now());
        if (p[0] === "counter") return k === "daily" ? (w.dailyDays.indexOf(today) >= 0 ? 1 : 0) : 0;
        if (p[0] === "log") { const l = w.logDay && w.logDay[k]; return l && l.day === today ? l.n : 0; }
        return qv[ch.id] || 0;
      }
      if (p[0] === "counter") return k === "packs" ? w.packs : k === "daily" ? w.dailyDays.length : k === "trades" ? w.trades : 0;
      if (p[0] === "log") return (w.logs && w.logs[k]) || 0;
      return qv[ch.id] || 0;
    }
    const dayStartMs = () => core.parisMidnight(core.dayKey(now()));
    async function weeklyStatus(caller) {
      const uid = caller.uid, wk = core.weekKey(now()), items = core.weekChallenges(wk), today = core.dayKey(now()), dch = core.dailyChallenge(today);
      const nextWk = core.weekKey(now() + 7 * 86400000);
      const [w, qv, dqv, feat, nextFeat] = await Promise.all([col("weekly").doc(uid).get().then((s) => normWeekly(s, wk)), queryValues(uid, items), queryValues(uid, [dch], dayStartMs()), featuredInfo(wk), featuredInfo(nextWk)]);
      const fv = await featValues(uid, feat.id, w, core.weekStart(now()));
      const fitems = core.featuredItems(feat.name).map((ch) => { const v = Math.min(ch.goal, fv[ch.id] || 0); return { id: ch.id, icon: ch.icon, label: ch.label, goal: ch.goal, value: v, done: v >= ch.goal, claimed: w.claimed.indexOf(ch.id) >= 0, reward: ch.reward }; });
      const list = items.map((ch) => { const v = Math.min(ch.goal, valueOf(ch, w, qv)); return { id: ch.id, icon: ch.icon, label: ch.label, goal: ch.goal, value: v, done: v >= ch.goal, claimed: w.claimed.indexOf(ch.id) >= 0, reward: ch.reward }; });
      const dv = Math.min(dch.goal, valueOf(dch, w, dqv, true));
      const daily = { id: dch.id, icon: dch.icon, label: dch.label, goal: dch.goal, value: dv, done: dv >= dch.goal, claimed: (w.claimedDaily || []).indexOf(today + ":" + dch.id) >= 0, reward: dch.reward, day: today };
      return { week: wk, endsAt: core.weekEnd(now()), items: list, daily, featured: { car: feat, next: { id: nextFeat.id, name: nextFeat.name }, items: fitems }, perfectBonus: core.PERFECT_WEEK_BONUS, allClaimed: list.every((x) => x.claimed) };
    }
    async function claimChallenge(caller, data) {
      const uid = caller.uid, wk = core.weekKey(now()), items = core.weekChallenges(wk), id = str(data && data.id, 40), today = core.dayKey(now());
      const isDaily = id.indexOf("d-") === 0, dch = core.dailyChallenge(today);
      const isFeat = id.indexOf("f-") === 0, feat = isFeat ? await featuredInfo(wk) : null;
      const ch = isDaily ? (dch.id === id ? dch : null) : isFeat ? core.featuredItems(feat.name).find((c) => c.id === id) : items.find((c) => c.id === id);
      if (!ch) fail("not-found", isDaily ? "Ce n'est pas le défi du jour." : "Ce défi ne fait pas partie de la semaine en cours.");
      const qv = isFeat ? {} : await queryValues(uid, [ch], isDaily ? dayStartMs() : null);
      const fvals = isFeat ? await featValues(uid, feat.id, await col("weekly").doc(uid).get().then((s) => normWeekly(s, wk)), core.weekStart(now())) : null;
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), w = await readWeekly(tx, uid, wk);
        const key = today + ":" + id;
        if (isDaily ? (w.claimedDaily || []).indexOf(key) >= 0 : w.claimed.indexOf(id) >= 0) fail("failed-precondition", "Récompense déjà récupérée.");
        if ((isFeat ? (fvals[ch.id] || 0) : valueOf(ch, w, qv, isDaily)) < ch.goal) fail("failed-precondition", "Défi pas encore accompli.");
        const r = ch.reward; let perfect = false;
        if (r.dust) dustMove(d, r.dust, "Défi validé");
        if (r.bonus) d.bonus += r.bonus;
        if (isDaily) { w.claimedDaily = (w.claimedDaily || []).concat([key]).slice(-14); }
        else {
          w.claimed.push(id); d.chal = (d.chal || 0) + 1;
          if (items.every((c) => w.claimed.indexOf(c.id) >= 0)) { perfect = true; d.bonus += core.PERFECT_WEEK_BONUS; }
        }
        core.seasonAdd(d, core.SEASON_PTS.challenge + (perfect ? 30 : 0), null, now(), true);
        writeCol(tx, uid, d); writeWeekly(tx, uid, w);
        return { reward: r, perfect, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- défis à cartes (affiches du mois)
    async function cardChalPosters(uid) {
      const pool = await getPool(), month = core.monthKey(now());
      const ids = core.cardChalCars(month, pool.ids.filter((x) => !core.isExtra(x) && pool.byId.has(x)), pool.rar);
      const [cs, cl, gs, sc] = await Promise.all([col("collections").doc(uid).get(), col("card_chals").doc(uid).get(), col("gstats").doc(uid).get(), col("set_claims").doc(uid).get()]);
      const dd = cs.exists ? cs.data() : {}, owned = dd.owned || {}, ex = cl.exists ? cl.data() : {}, claimed = ex.claimed || {}, g = gs.exists ? gs.data() : {};
      const now_ = { quiz: g.quizPerfect || 0, packs: dd.opened || 0, trade: dd.trades || 0, album: sc.exists ? Object.keys(sc.data().done || {}).length : 0 };
      const hasBase = !!(ex.base && ex.base[month]), base = hasBase ? Object.assign({ album: now_.album }, ex.base[month]) : now_;
      const ownedIds = Object.keys(owned).filter((k) => owned[k] > 0);
      let comments = null;
      const posters = [];
      for (const id of ids) {
        const c = pool.byId.get(id) || {}, name = str(c.name || id, 80), brand = str(c.brand || "", 40), rar = pool.rar.get(id), goals = core.CARD_GOALS[rar] || core.CARD_GOALS.rare;
        const exists = (n) => col(n).doc("cat_" + id + "_" + uid).get().then((x) => x.exists).catch(() => false);
        const [lk, rc] = await Promise.all([exists("likes"), exists("reactions")]);
        if (comments === null) comments = await col("comments").where("uid", "==", uid).limit(500).get().then((r) => r.docs.map((d) => d.data())).catch(() => []);
        const cm = comments.some((x) => x.target === id && x.kind === "cat");
        const brandTotal = brand ? pool.ids.filter((k) => (pool.byId.get(k) || {}).brand === brand && !core.isExtra(k)).length : 0;
        const nb = brand ? ownedIds.filter((k) => ((pool.byId.get(k) || {}).brand || "") === brand).length : 0;
        const bg = Math.min(goals.brand, Math.max(3, brandTotal - 1));
        const defs = [["c-react", lk || rc], ["c-comment", cm]];
        if (brand) defs.push(["c-brand", nb >= bg, Math.min(bg, nb), bg]);
        defs.push(["c-quiz", now_.quiz - (base.quiz || 0) >= goals.quiz, Math.min(goals.quiz, now_.quiz - (base.quiz || 0)), goals.quiz]);
        defs.push(["c-packs", now_.packs - (base.packs || 0) >= goals.packs, Math.min(goals.packs, now_.packs - (base.packs || 0)), goals.packs]);
        if (goals.album) defs.push(["c-album", now_.album - (base.album || 0) >= goals.album, Math.min(goals.album, now_.album - (base.album || 0)), goals.album]);
        if (goals.trade) defs.push(["c-trade", now_.trade - (base.trade || 0) >= goals.trade, Math.min(goals.trade, now_.trade - (base.trade || 0)), goals.trade]);
        const tasks = defs.map((x) => { const t = core.CARD_CHALS.find((y) => y.id === x[0]); return { id: x[0], icon: t.icon, label: t.label(name, brand, x[3]), done: !!x[1], value: x[2], goal: x[3] }; });
        posters.push({ id, name, brand, image: str(c.image || c.img || "", 400), rar, owned: owned[id] || 0, claimed: !!claimed[id], tasks, ready: !claimed[id] && tasks.every((t) => t.done) });
      }
      return { month, posters, claimed, base: hasBase && ex.base[month].album !== undefined ? null : { [month]: hasBase ? Object.assign({}, ex.base[month], { album: now_.album }) : now_ } };
    }
    async function cardChallenges(caller) {
      const r = await cardChalPosters(caller.uid);
      if (r.base) await col("card_chals").doc(caller.uid).set({ base: r.base }, { merge: true }).catch(() => {});
      return { month: r.month, endsAt: monthEnd(), posters: r.posters };
    }
    function monthEnd() { const k = core.monthKey(now()).split("-"), y = Number(k[0]), m = Number(k[1]); return core.parisMidnight(y + (m === 12 ? 1 : 0) + "-" + String(m === 12 ? 1 : m + 1).padStart(2, "0") + "-01"); }
    async function claimCardChallenge(caller, data) {
      const uid = caller.uid, carId = str(data && data.carId, 90);
      const r = await cardChalPosters(uid), p = r.posters.find((x) => x.id === carId);
      if (!p) fail("not-found", "Cette affiche n'est pas disponible ce mois-ci.");
      if (p.claimed) fail("failed-precondition", "Carte déjà gagnée avec cette affiche.");
      if (!p.tasks.every((t) => t.done)) fail("failed-precondition", "Il reste des défis à accomplir sur cette affiche.");
      return db.runTransaction(async (tx) => {
        const ref = col("card_chals").doc(uid), cs = await tx.get(ref), claimed = cs.exists ? cs.data().claimed || {} : {};
        if (claimed[carId]) fail("failed-precondition", "Carte déjà gagnée avec cette affiche.");
        const d = await readCol(tx, uid);
        d.owned[carId] = (d.owned[carId] || 0) + 1; core.histAdd(d, carId, "affiche", now());
        core.seasonAdd(d, core.SEASON_PTS.challenge * 2, null, now(), true);
        claimed[carId] = now();
        writeCol(tx, uid, d); tx.set(ref, { claimed, updatedAt: ts() }, { merge: true });
        return { cardId: carId, name: p.name, rar: p.rar, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- échanges de doublons
    async function proposeTrade(caller, data) {
      const uid = caller.uid, to = str(data && data.toUid, 128), give = str(data && data.give, 90), want = str(data && data.want, 90), message = str(data && data.message, 140);
      if (!to || to === uid) fail("invalid-argument", "Choisis un autre pilote.");
      if (!give || !want || give === want) fail("invalid-argument", "Choisis deux cartes différentes.");
      if (await isMuted(uid)) fail("permission-denied", "Tu es en sourdine : les échanges sont suspendus.");
      const pool = await getPool();
      if (!(await isKnownCard(pool, give)) || !(await isKnownCard(pool, want))) fail("not-found", "Carte inconnue.");
      const toName = await nameOf(to); if (!toName) fail("not-found", "Pilote introuvable.");
      const fromName = (await nameOf(uid)) || caller.name || "Pilote";
      const [a, b] = await Promise.all([col("collections").doc(uid).get(), col("collections").doc(to).get()]);
      const mine = a.exists ? a.data().owned || {} : {}, theirs = b.exists ? b.data().owned || {} : {};
      if (a.exists && a.data().locked && a.data().locked[give]) fail("failed-precondition", "🔒 Cette carte est verrouillée : déverrouille-la pour l'échanger.");
      if ((mine[give] || 0) < 2) fail("failed-precondition", "Tu ne peux échanger qu'un doublon : tu n'as qu'un exemplaire de cette carte.");
      if ((mine[want] || 0) > 0) fail("failed-precondition", "Tu possèdes déjà la carte demandée.");
      if ((theirs[want] || 0) < 2) fail("failed-precondition", "Ce pilote n'a pas cette carte en double.");
      const open = (await col("trades").where("fromUid", "==", uid).limit(100).get()).docs.map((d) => d.data()).filter((t) => t.status === "open");
      if (open.length >= MAX_OPEN_TRADES) fail("resource-exhausted", "Tu as déjà " + MAX_OPEN_TRADES + " propositions en attente.");
      if (open.some((t) => t.toUid === to && t.give === give && t.want === want)) fail("already-exists", "Cette proposition existe déjà.");
      const ref = col("trades").doc();
      await ref.set({ fromUid: uid, fromName, toUid: to, toName, give, want, message, status: "open", createdAt: ts(), updatedAt: ts() });
      await notify(to, { uid, name: fromName }, fromName + " te propose un échange de cartes", "#/jouer/echanges", "trade");
      const gn = await cardLabel(pool, give), wn = await cardLabel(pool, want);
      const dmId = await sendDm(uid, fromName, to, "🃏 Proposition d'échange : " + gn + " contre " + wn, { tradeId: ref.id, tradeGive: give, tradeWant: want, tradeGiveName: gn, tradeWantName: wn, tradeNote: message, tradeStatus: "open", tradeTo: to });
      if (dmId) { try { await ref.update({ dmId }); } catch (_) { /* facultatif */ } }
      return { id: ref.id };
    }
    async function cardLabel(pool, id) {
      const c = pool.byId.get(id);
      if (c && c.name) return str(c.name, 80);
      try { const sp = await specialCard(id); if (sp && sp.name) return str(sp.name, 80); } catch (_) { /* nom générique */ }
      return "une carte";
    }
    // message privé automatique + résumé de conversation (liste « messagerie ») ; renvoie l'identifiant du message
    async function sendDm(from, fromName, to, text, extra) {
      try {
        const conv = [from, to].sort().join("_");
        const msg = Object.assign({ uid: from, pilot: str(fromName, 40), avatar: "", text: str(text, 400), mediaUrl: "", replyTo: null, reactions: {}, timestamp: ts() }, extra || {});
        const r = await col("private_chats/" + conv + "/messages").add(msg);
        try { await col("private_chats").doc(conv).set({ uids: [from, to].sort(), lastUid: from, lastName: str(fromName, 40), lastText: str(text, 120), lastAt: ts() }, { merge: true }); } catch (_) { /* résumé facultatif */ }
        return r && r.id ? r.id : "";
      } catch (_) { return ""; /* message facultatif */ }
    }
    // met à jour la carte d'échange dans la conversation + ajoute une ligne de statut
    async function settleTradeMessage(t, status, byUid, byName, line) {
      try {
        const conv = [t.fromUid, t.toUid].sort().join("_");
        if (t.dmId) await col("private_chats/" + conv + "/messages").doc(t.dmId).update({ tradeStatus: status });
        await sendDm(byUid, byName, byUid === t.fromUid ? t.toUid : t.fromUid, line, { tradeEvent: status });
      } catch (_) { /* facultatif */ }
    }
    async function respondTrade(caller, data) {
      const uid = caller.uid, id = str(data && data.id, 128), accept = !!(data && data.accept), wk = core.weekKey(now());
      const ref = col("trades").doc(id);
      let t = null, ok = true, msg = "";
      await db.runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists) fail("not-found", "Proposition introuvable.");
        t = s.data();
        if (t.toUid !== uid) fail("permission-denied", "Cette proposition ne t'est pas adressée.");
        if (t.status !== "open") fail("failed-precondition", "Cette proposition n'est plus d'actualité.");
        if (!accept) { tx.update(ref, { status: "declined", updatedAt: ts() }); return; }
        const from = await readCol(tx, t.fromUid), to = await readCol(tx, uid);
        const wf = await readWeekly(tx, t.fromUid, wk), wt = await readWeekly(tx, uid, wk);
        if (core.isLocked(from, t.give) || core.isLocked(to, t.want)) {
          ok = false; msg = "Une des cartes est verrouillée : échange annulé.";
          tx.update(ref, { status: "cancelled", updatedAt: ts() }); return;
        }
        if ((from.owned[t.give] || 0) < 2 || (to.owned[t.want] || 0) < 2 || (from.owned[t.want] || 0) > 0) {
          ok = false; msg = "Les cartes ne sont plus disponibles : proposition annulée.";
          tx.update(ref, { status: "cancelled", updatedAt: ts() }); return;
        }
        from.owned[t.give]--; from.owned[t.want] = (from.owned[t.want] || 0) + 1; core.histAdd(from, t.want, "trade", now());
        to.owned[t.want]--; to.owned[t.give] = (to.owned[t.give] || 0) + 1; core.histAdd(to, t.give, "trade", now());
        from.trades = (from.trades || 0) + 1; to.trades = (to.trades || 0) + 1; wf.trades++; wt.trades++;
        bump(from, "trade"); bump(to, "trade");
        core.seasonAdd(from, core.SEASON_PTS.trade, null, now()); core.seasonAdd(to, core.SEASON_PTS.trade, null, now());
        writeCol(tx, t.fromUid, from); writeCol(tx, uid, to); writeWeekly(tx, t.fromUid, wf); writeWeekly(tx, uid, wt);
        tx.update(ref, { status: "accepted", updatedAt: ts() });
      });
      const me = (await nameOf(uid)) || caller.name || "Pilote";
      if (ok) await settleTradeMessage(t, accept ? "accepted" : "declined", uid, me, accept ? "✅ Échange réalisé ! Les cartes ont changé de main." : "❌ Échange refusé.");
      else await settleTradeMessage(t, "cancelled", uid, me, "⚠️ Échange annulé : les cartes ne sont plus disponibles.");
      if (ok) await notify(t.fromUid, { uid, name: me }, accept ? me + " a accepté ton échange 🎉" : me + " a décliné ton échange", "#/jouer/echanges", "trade");
      return { ok, accepted: accept && ok, message: msg };
    }
    async function cancelTrade(caller, data) {
      const ref = col("trades").doc(str(data && data.id, 128));
      let tr = null;
      const res = await db.runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists) fail("not-found", "Proposition introuvable.");
        const t = s.data();
        if (t.fromUid !== caller.uid) fail("permission-denied", "Seul l'auteur peut annuler.");
        if (t.status !== "open") fail("failed-precondition", "Cette proposition n'est plus en attente.");
        tx.update(ref, { status: "cancelled", updatedAt: ts() });
        tr = t;
        return { ok: true };
      });
      if (tr) await settleTradeMessage(tr, "cancelled", caller.uid, (await nameOf(caller.uid)) || caller.name || "Pilote", "↩️ Proposition d'échange annulée.");
      return res;
    }

    // ---------------------------------------------------------------- cartes spéciales (attribuées par l'administrateur)
    async function adminGrantCard(caller, data) {
      if (!caller.system) await requireAdmin(caller);
      const uid = str(data && data.uid, 128), cardId = str(data && data.cardId, 90), mode = data && data.mode === "revoke" ? "revoke" : "grant";
      const qty = Math.max(1, Math.min(10, Math.floor(Number(data && data.qty) || 1)));
      if (!uid || !cardId) fail("invalid-argument", "Pilote et carte obligatoires.");
      const pool = await getPool(), special = core.isSpecial(cardId);
      const name = await nameOf(uid); if (!name) fail("not-found", "Pilote introuvable.");
      if (!special && !pool.byId.has(cardId)) fail("not-found", "Carte inconnue.");
      let label = cardId, serials = [];
      await db.runTransaction(async (tx) => {
        const cref = col("special_cards").doc(cardId), gref = col("special_grants").doc(cardId + "_" + uid);
        const cs = special ? await tx.get(cref) : null, gs = special ? await tx.get(gref) : null, d = await readCol(tx, uid);
        if (special) {
          if (!cs.exists) fail("not-found", "Carte spéciale introuvable.");
          const card = cs.data(); label = card.name || cardId;
          if (mode === "grant") {
            const supply = Number(card.supply) || 0, granted = Number(card.granted) || 0;
            if (supply > 0 && granted + qty > supply) fail("failed-precondition", "Tirage épuisé : " + granted + " / " + supply + " exemplaires déjà attribués.");
            for (let i = 1; i <= qty; i++) serials.push(granted + i);
            tx.update(cref, { granted: granted + qty });
            const old = gs.exists ? gs.data() : { cardId, uid, name, serials: [] };
            tx.set(gref, { cardId, uid, name, serials: (old.serials || []).concat(serials), updatedAt: ts() });
          }
        } else { const car = pool.byId.get(cardId); label = car.name || cardId; }
        d.owned[cardId] = mode === "grant" ? (d.owned[cardId] || 0) + qty : Math.max(0, (d.owned[cardId] || 0) - qty);
        if (d.owned[cardId] === 0) delete d.owned[cardId];
        writeCol(tx, uid, d);
      });
      if (mode === "grant") await notify(uid, { uid: caller.uid, name: "MOTORAUTO" }, "🎁 Tu as reçu la carte « " + label + " »", "#/jouer/collection");
      return { ok: true, serials };
    }

    // ---------------------------------------------------------------- outils d'administration du jeu (tests, geste commercial)
    async function adminGameTool(caller, data) {
      await requireAdmin(caller);
      const action = str(data && data.action, 20), uid = str(data && data.uid, 128) || caller.uid;
      const qty = Math.max(1, Math.min(100000, Math.floor(Number(data && data.qty) || 1)));
      if (action === "circuitPhoto") {
        const cid = str(data && data.id, 60), url = str(data && data.url, 600).trim();
        if (!core.isCircuit(cid) || !core.CIRCUIT_BY_ID.has(cid)) fail("invalid-argument", "Circuit inconnu.");
        if (url && !/^https:\/\/[^\s"'<>]+$/.test(url)) fail("invalid-argument", "L'adresse de la photo doit commencer par https://");
        const ref = col("config").doc("circuitPhotos"), cur = await ref.get(), map = (cur.exists && cur.data().map) || {};
        if (url) map[cid] = url; else delete map[cid];
        await ref.set({ map, at: ts() });
        return { ok: true, count: Object.keys(map).length };
      }
      if (action === "gameSettings") {
        const cur = await gameSettings(), next = { wheel: data.wheel !== false, advent: data.advent !== false, at: ts() };
        await col("config").doc("gameSettings").set(Object.assign({}, cur, next)); return { ok: true, wheel: next.wheel, advent: next.advent };
      }
      if (action === "gameStats") {
        const today = core.dayKey(now()), snap = await col("collections").limit(5000).get(), st = { players: 0, today: 0, packs: 0, cards: 0, crystals: 0, wheelToday: 0 };
        snap.forEach((d) => { const x = d.data(); st.players++; st.packs += x.opened || 0; st.cards += x.count || 0; st.crystals += x.dust || 0; if (x.lastPack === today) st.today++; if (x.wheelDay === today) st.wheelToday++; });
        return Object.assign({ ok: true, settings: await gameSettings() }, st);
      }
      if (action === "cardStats") return Object.assign({ ok: true }, await computeCardStats());
      if (action === "revokeLegend") {
        // retire une carte Légende à un pilote ; reopen = le pilote pourra de nouveau réclamer l'album (et regagner sa Légende)
        const cardId = str(data && data.cardId, 90), reopen = !!(data && data.reopen);
        if (core.LEGEND_IDS.indexOf(cardId) < 0) fail("invalid-argument", "Ce n'est pas une carte Légende.");
        if (!(await nameOf(uid))) fail("not-found", "Pilote introuvable.");
        return db.runTransaction(async (tx) => {
          const d = await readCol(tx, uid), ref = col("set_claims").doc(uid), cs = reopen ? await tx.get(ref) : null;
          if (!(d.owned[cardId] > 0)) fail("failed-precondition", "Ce pilote ne possède pas cette carte Légende.");
          delete d.owned[cardId]; if (d.lv) delete d.lv[cardId]; if (d.locked) delete d.locked[cardId];
          let reopened = "";
          if (reopen && cs && cs.exists) {
            const done = Object.assign({}, cs.data().done || {}), key = Object.keys(core.LEGENDS).find((k) => core.LEGENDS[k] === cardId);
            if (key && done[key]) { delete done[key]; reopened = key; tx.set(ref, { done, updatedAt: ts() }); }
          }
          writeCol(tx, uid, d);
          return { ok: true, reopened, doc: view(d) };
        });
      }
      if (["bonus", "dust", "resetDaily", "resetCollection", "unlockAll"].indexOf(action) < 0) fail("invalid-argument", "Action inconnue.");
      if (!(await nameOf(uid))) fail("not-found", "Pilote introuvable.");
      const pool = await getPool();
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if (action === "bonus") d.bonus = Math.min(1000, d.bonus + Math.min(qty, 100));
        else if (action === "dust") d.dust = Math.min(1000000, d.dust + qty);
        else if (action === "resetDaily") d.lastPack = "";
        else if (action === "unlockAll") pool.ids.forEach((id) => { if (!d.owned[id]) d.owned[id] = 1; });
        else if (action === "resetCollection") { const b = core.blankCollection(); Object.keys(b).forEach((k) => { d[k] = b[k]; }); d.bonus = 0; }
        core.recount(d); writeCol(tx, uid, d);
        return { ok: true, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- annonce à tous les pilotes (notification)
    async function adminBroadcast(caller, data) {
      await requireAdmin(caller);
      const text = str(data && data.text, 120).trim(), link = str(data && data.link, 200).trim() || "#/";
      if (text.length < 3) fail("invalid-argument", "Écris un message d'au moins 3 caractères.");
      if (!/^(#\/|https:\/\/)/.test(link)) fail("invalid-argument", "Le lien doit commencer par #/ ou https://");
      const snap = await col("users").limit(5000).get();
      let n = 0;
      for (const d of snap.docs) { await notify(d.id, { uid: caller.uid, name: "MOTORAUTO" }, text, link); n++; }
      return { ok: true, sent: n };
    }

    // ---------------------------------------------------------------- parrainage : +1 pack bonus pour le parrain et le filleul
    const REFERRAL_MAX = 30;
    async function claimReferral(caller, data) {
      const ref = str(data && data.ref, 128).trim();
      if (!ref || ref === caller.uid) fail("invalid-argument", "Lien de parrainage invalide.");
      const rname = await nameOf(ref); if (!rname) fail("not-found", "Ce parrain n'existe pas.");
      const me = await nameOf(caller.uid); if (!me) fail("failed-precondition", "Termine d'abord la création de ton profil.");
      if (deps.accountCreatedMs) {
        const created = await deps.accountCreatedMs(caller.uid);
        if (created && now() - created > 3 * 86400000) fail("failed-precondition", "Le parrainage n'est possible que les premiers jours d'un compte.");
      }
      const already = await col("referrals").doc(caller.uid).get();
      if (already.exists) fail("already-exists", "Tu as déjà utilisé un lien de parrainage.");
      const mine = await col("referrals").where("referrerUid", "==", ref).limit(REFERRAL_MAX + 1).get();
      if (mine.size >= REFERRAL_MAX) fail("resource-exhausted", "Ce parrain a atteint la limite de " + REFERRAL_MAX + " filleuls.");
      await db.runTransaction(async (tx) => {
        const a = await readCol(tx, ref), b = await readCol(tx, caller.uid);
        a.bonus += 1; b.bonus += 1;
        writeCol(tx, ref, a); writeCol(tx, caller.uid, b);
        tx.set(col("referrals").doc(caller.uid), { uid: caller.uid, name: me, referrerUid: ref, referrerName: rname, createdAt: ts() });
      });
      await notify(ref, { uid: caller.uid, name: me }, "🎁 " + me + " s'est inscrit grâce à toi : +1 pack bonus !", "#/jouer/boutique");
      return { ok: true, bonus: 1, referrerName: rname };
    }

    // ---------------------------------------------------------------- cartes d'événement (le pilote la récupère lui-même pendant la période)
    async function claimSpecial(caller, data) {
      const cardId = str(data && data.cardId, 90);
      if (!cardId || !core.isSpecial(cardId)) fail("invalid-argument", "Carte d'événement inconnue.");
      const cs = await col("special_cards").doc(cardId).get();
      if (!cs.exists) fail("not-found", "Carte d'événement introuvable.");
      const c = cs.data(), t = now();
      if (!c.claimable) fail("failed-precondition", "Cette carte n'est pas distribuée en libre-service.");
      if (c.startsAtMs && t < Number(c.startsAtMs)) fail("failed-precondition", "L'événement n'a pas encore commencé.");
      if (c.endsAtMs && t > Number(c.endsAtMs)) fail("failed-precondition", "L'événement est terminé.");
      const gs = await col("special_grants").doc(cardId + "_" + caller.uid).get();
      if (gs.exists && (gs.data().serials || []).length) fail("already-exists", "Tu as déjà récupéré cette carte.");
      const r = await adminGrantCard({ uid: "system", system: true }, { uid: caller.uid, cardId, qty: 1 });
      return { ok: true, serials: r.serials, name: c.name || cardId };
    }

    // ---------------------------------------------------------------- concours photo mensuel
    async function openContest(month, theme) {
      const ref = col("contests").doc(month), s = await ref.get();
      if (s.exists) return { month, existed: true };
      const idx = Number(month.split("-")[1]) - 1;
      await ref.set({ month, theme: str(theme, 80) || core.THEMES[idx % core.THEMES.length], status: "open", createdAt: ts() });
      return { month, existed: false };
    }
    async function closeContest(month) {
      const ref = col("contests").doc(month), cs = await ref.get();
      if (!cs.exists) fail("not-found", "Concours introuvable.");
      if (cs.data().status === "closed") fail("failed-precondition", "Ce concours est déjà clôturé.");
      const [er, vr] = await Promise.all([col("contest_entries").where("contest", "==", month).limit(500).get(), col("contest_votes").where("contest", "==", month).limit(5000).get()]);
      const entries = er.docs.map((d) => Object.assign({ id: d.id }, d.data())).filter((e) => e.status === "approved");
      const tally = new Map(); entries.forEach((e) => tally.set(e.id, 0));
      vr.docs.forEach((d) => { const v = d.data(); const e = entries.find((x) => x.id === v.entry); if (e && v.uid !== e.uid) tally.set(e.id, tally.get(e.id) + 1); });
      const ranked = entries.map((e) => ({ e, votes: tally.get(e.id) })).sort((a, b) => b.votes - a.votes || tsMs(a.e.createdAt) - tsMs(b.e.createdAt));
      const results = ranked.slice(0, 3).map((r) => ({ entry: r.e.id, uid: r.e.uid, name: str(r.e.name, 40), photo: str(r.e.photo, 500), photos: (Array.isArray(r.e.photos) ? r.e.photos : []).slice(0, 12).map((u) => str(u, 500)), votes: r.votes }));
      const custom = !/^\d{4}-\d{2}$/.test(month), win = ranked[0] ? ranked[0].e : null, label = custom ? str(cs.data().theme, 40) : core.monthLabel(month);
      if (win) {
        const sid = "sp-photo-" + month;
        await col("special_cards").doc(sid).set({ name: custom ? "Gagnant du concours" : "Photographe du mois", edition: "Concours photo · " + label, image: str(win.photo, 500), images: (win.photos && win.photos.length ? win.photos : [win.photo]).slice(0, 4).map((u) => str(u, 500)), color: "gold", power: 0, speed: 0, zero: 0,
          text: "« " + str(win.caption || cs.data().theme, 100) + " » — photo de " + str(win.name, 40), supply: 1, granted: 0, active: true, kind: "contest", createdAt: ts() });
        await adminGrantCard({ uid: "system", system: true }, { uid: win.uid, cardId: sid, qty: 1 });
        const dustTo = [null, 150, 80];
        for (let i = 1; i < results.length; i++) {
          await db.runTransaction(async (tx) => { const d = await readCol(tx, results[i].uid); d.dust += dustTo[i]; writeCol(tx, results[i].uid, d); });
          await notify(results[i].uid, { name: "MOTORAUTO" }, "📸 " + (i + 1) + "e du concours photo de " + label + " : +" + dustTo[i] + " cristaux", "#/jouer/concours");
        }
        await notify(win.uid, { name: "MOTORAUTO" }, "🏆 Tu remportes le concours photo de " + label + " !", "#/jouer/concours");
      }
      await ref.update({ status: "closed", winnerUid: win ? win.uid : "", winnerEntry: win ? win.id : "", winnerName: win ? str(win.name, 40) : "", results, entries: entries.length, totalVotes: vr.docs.length, closedAt: ts() });
      return { month, winner: win ? win.uid : null, results };
    }
    async function adminContest(caller, data) {
      await requireAdmin(caller);
      const action = data && data.action, month = /^[\w-]{4,40}$/.test(str(data && data.month, 40)) ? data.month : core.monthKey(now());
      if (action === "open") return openContest(month, data.theme);
      if (action === "close") return closeContest(month);
      if (action === "theme") { await col("contests").doc(month).update({ theme: str(data.theme, 80) }); return { ok: true }; }
      fail("invalid-argument", "Action inconnue.");
    }
    /** appelé le 1er du mois : clôture le concours du mois précédent et ouvre le nouveau */
    async function monthlyContest() {
      const nowMonth = core.monthKey(now()), prev = core.monthKey(now() - 20 * 86400000);
      if (prev !== nowMonth) { const p = await col("contests").doc(prev).get(); if (p.exists && p.data().status === "open") await closeContest(prev); }
      const r = await openContest(nowMonth);
      try { await broadcastType("📸 Le concours photo du mois est ouvert : envoie jusqu'à 3 photos !", "#/jouer/concours", "contest"); } catch (_) { /* annonce facultative */ }
      return r;
    }
    /** annonce à tous les pilotes (cloche du site ; le push dépend de leurs préférences) */
    async function broadcastType(text, link, type) {
      const snap = await col("users").limit(5000).get(); let n = 0;
      for (const d of snap.docs) { await notify(d.id, { uid: "motorauto", name: "MOTORAUTO" }, text, link, type); n++; }
      return n;
    }
    /** chaque soir : rappel du jour (pack / roue pas encore pris, pour ceux qui l'ont activé) et rappel de fin de saison (3 jours avant) */
    async function dailyReminder() {
      const today = core.dayKey(now()); let sent = 0;
      const prefs = await col("notif_prefs").where("daily", "==", true).limit(2000).get();
      for (const p of prefs.docs) {
        const c = await col("collections").doc(p.id).get(), d = c.exists ? c.data() : {};
        if (d.lastPack !== today || d.wheelDay !== today) { await notify(p.id, { uid: "motorauto", name: "MOTORAUTO" }, "🎁 Ton pack du jour et ta roue t'attendent !", "#/jouer/boutique", "daily"); sent++; }
      }
      const sn = core.seasonInfo(now());
      if (sn.daysLeft === 3) {
        const all = await col("collections").limit(5000).get();
        for (const c of all.docs) { if ((c.data().opened || 0) > 0) { await notify(c.id, { uid: "motorauto", name: "MOTORAUTO" }, "⏳ Plus que 3 jours pour finir la saison " + sn.n + " !", "#/jouer/saison", "season"); sent++; } }
      }
      return { sent };
    }

    /** appelé chaque nuit : clôture les concours dont la date de fin (réglable par l'admin) est passée */
    async function closeDueContests() {
      const today = core.dayKey(now()), out = [];
      const snap = await col("contests").where("status", "==", "open").limit(50).get();
      for (const d of snap.docs) {
        const c = d.data();
        if (c.endsAt && /^\d{4}-\d{2}-\d{2}$/.test(String(c.endsAt)) && String(c.endsAt) < today) { try { await closeContest(d.id); out.push(d.id); } catch (_) { /* déjà clôturé */ } }
      }
      return out;
    }

    // ---------------------------------------------------------------- compteurs de jeu supplémentaires (fusion, marché, Plus ou moins, quiz)
    const blankStats = () => ({ bpDay: { day: "", dust: 0 }, bpPack: "", bpPair: null, fuse: 0, sold: 0, bought: 0, pmBest: 0, pmStreak: 0, pmPair: null, pmDay: { day: "", dust: 0 }, quizDone: 0, quizPerfect: 0, quizL3: 0, quizBest: {}, quizPts: 0, quizDay: { day: "", dust: 0 }, wishAt: 0 });
    async function readStats(tx, uid) { const s = await tx.get(col("gstats").doc(uid)); return s.exists ? Object.assign(blankStats(), s.data()) : blankStats(); }
    function writeStats(tx, uid, g) { g.updatedAt = ts(); tx.set(col("gstats").doc(uid), g); }
    const dayOf = (g, key) => { const today = core.dayKey(now()); if (!g[key] || g[key].day !== today) g[key] = { day: today, dust: 0 }; return g[key]; };

    // ---------------------------------------------------------------- fusion : 5 doublons d'une rareté → 1 carte de la rareté au-dessus
    async function fuseCards(caller, data) {
      const uid = caller.uid, from = str(data && data.rarity, 12), to = core.FUSE_NEXT[from], pool = await getPool();
      if (!to) fail("invalid-argument", "Cette rareté ne peut pas être fusionnée.");
      const chosen = Array.isArray(data && data.ids) ? data.ids.slice(0, 20).map((x) => str(x, 90)) : null;
      const candidates = pool.list.filter((c) => pool.rar.get(c.id) === to).map((c) => c.id);
      if (!candidates.length) fail("unavailable", "Aucune carte de cette rareté n'est disponible pour l'instant.");
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), g = await readStats(tx, uid);
        const spare = (id) => (core.isSpecial(id) || core.isLocked(d, id) || pool.rar.get(id) !== from ? 0 : Math.max(0, (d.owned[id] || 0) - 1));
        let used = [];
        if (chosen && chosen.length) {
          if (chosen.length !== core.FUSE_COUNT) fail("invalid-argument", "Choisis exactement " + core.FUSE_COUNT + " doublons.");
          const need = {}; chosen.forEach((id) => { need[id] = (need[id] || 0) + 1; });
          Object.keys(need).forEach((id) => { if (need[id] > spare(id)) fail("failed-precondition", "Tu n'as pas assez de doublons de cette carte."); });
          used = chosen;
        } else {
          const list = Object.keys(d.owned).map((id) => [id, spare(id)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
          for (const [id, n] of list) { for (let i = 0; i < n && used.length < core.FUSE_COUNT; i++) used.push(id); if (used.length >= core.FUSE_COUNT) break; }
          if (used.length < core.FUSE_COUNT) fail("failed-precondition", "Il te faut " + core.FUSE_COUNT + " doublons de rareté « " + core.RAR[from].label + " » (tu en as " + used.length + ").");
        }
        used.forEach((id) => { d.owned[id]--; });
        const fresh = candidates.filter((id) => !(d.owned[id] > 0)), bag = fresh.length ? fresh : candidates;
        const got = bag[Math.floor(rng() * bag.length)];
        d.owned[got] = (d.owned[got] || 0) + 1; core.histAdd(d, got, "fuse", now()); g.fuse++;
        core.seasonAdd(d, core.SEASON_PTS.fuse, null, now());
        writeCol(tx, uid, d); writeStats(tx, uid, g);
        return { from, to, used, got, isNew: fresh.length > 0, fuse: g.fuse, doc: view(d) };
      });
    }


    // ---------------------------------------------------------------- verrou et recyclage de doublons
    async function lockCard(caller, data) {
      const uid = caller.uid, id = str(data && data.id, 90), on = !(data && data.on === false), pool = await getPool();
      if (!(await isKnownCard(pool, id))) fail("not-found", "Carte inconnue.");
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if (!(d.owned[id] > 0)) fail("failed-precondition", "Tu ne possèdes pas cette carte.");
        d.locked = d.locked || {};
        if (on) { if (Object.keys(d.locked).length >= 400) fail("resource-exhausted", "Trop de cartes verrouillées (400 maximum)."); d.locked[id] = 1; } else delete d.locked[id];
        writeCol(tx, uid, d);
        return { locked: on, doc: view(d) };
      });
    }
    /** recycle des doublons choisis : [{ id, n }] → cristaux (on garde toujours 1 exemplaire ; les cartes verrouillées sont refusées) */
    async function recycleCards(caller, data) {
      const uid = caller.uid, pool = await getPool();
      const items = (Array.isArray(data && data.items) ? data.items : []).slice(0, core.RECYCLE_MAX).map((x) => ({ id: str(x && x.id, 90), n: Math.max(1, Math.min(50, Math.floor(Number(x && x.n) || 1))) }));
      if (!items.length) fail("invalid-argument", "Choisis au moins un doublon à recycler.");
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid); let gain = 0, count = 0; const seen = {};
        items.forEach((it) => {
          if (seen[it.id]) fail("invalid-argument", "Carte choisie deux fois."); seen[it.id] = 1;
          if (core.isSpecial(it.id) || !pool.byId.has(it.id)) fail("invalid-argument", "Cette carte ne se recycle pas.");
          if (core.isLocked(d, it.id)) fail("failed-precondition", "🔒 Une carte choisie est verrouillée.");
          const spare = Math.max(0, (d.owned[it.id] || 0) - 1);
          if (it.n > spare) fail("failed-precondition", "Tu n'as pas autant de doublons de cette carte.");
          const rar = pool.rar.get(it.id);
          d.owned[it.id] -= it.n; gain += core.RAR[rar].dust * it.n; count += it.n;
        });
        dustMove(d, gain, "Recyclage de " + count + " doublon" + (count > 1 ? "s" : ""));
        writeCol(tx, uid, d);
        return { gain, count, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- Plus ou moins
    async function pmPlay(caller, data) {
      const uid = caller.uid, pool = await getPool(), answer = !!(data && data.action === "answer");
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), d = await readCol(tx, uid);
        let result = null, reward = 0;
        if (answer) {
          if (!g.pmPair) fail("failed-precondition", "Aucune question en cours : relance une partie.");
          const pick = data.pick === "b" ? "b" : "a", win = core.pmWinner(g.pmPair, pool.pmById), pair = g.pmPair;
          if (!win) { g.pmPair = null; g.pmStreak = 0; writeStats(tx, uid, g); fail("failed-precondition", "Cette question n'est plus valable : relance une partie."); }
          const ok = win === pick;
          result = { ok, answer: win, pair };
          if (ok) {
            g.pmStreak++; if (g.pmStreak > g.pmBest) g.pmBest = g.pmStreak;
            const step = core.PM_REWARDS.find((r) => r[0] === g.pmStreak);
            if (step) { const day = dayOf(g, "pmDay"), gain = Math.min(step[1], core.PM_DAILY_CAP - day.dust); if (gain > 0) { day.dust += gain; reward = gain; dustMove(d, gain, "Plus ou moins"); } }
          } else g.pmStreak = 0;
          g.pmPair = null;
        } else g.pmStreak = 0;
        let next = null;
        if (!answer || (result && result.ok)) { next = core.pmPair(pool.pmList, rng, result ? result.pair : null, g.pmStreak); g.pmPair = next; }
        if (result && result.ok) core.seasonAdd(d, core.SEASON_PTS.pmOk, { pm: 1 }, now());
        writeStats(tx, uid, g); if ((result && result.ok) || reward) writeCol(tx, uid, d);
        return { result, next, streak: g.pmStreak, best: g.pmBest, reward, doc: reward ? view(d) : null };
      });
    }

    // ---------------------------------------------------------------- Quiz : le serveur rejoue les questions de la graine et corrige
    async function quizSubmit(caller, data) {
      const uid = caller.uid, pool = await getPool(), seed = str(data && data.seed, 40), cat = str(data && data.cat, 12), level = Math.max(1, Math.min(4, Number(data && data.level) | 0));
      if (!/^[\w-]{4,40}$/.test(seed)) fail("invalid-argument", "Quiz invalide.");
      if (!core.QCATS[cat]) fail("invalid-argument", "Catégorie inconnue.");
      const answers = (Array.isArray(data && data.answers) ? data.answers : []).slice(0, core.QUIZ_N).map((x) => (Array.isArray(x) ? x.slice(0, 6).map((y) => Number(y) | 0) : Number(x) | 0));
      const questions = core.quizBuild(seed, cat, level, pool.list), score = core.quizScore(questions, answers);
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), d = await readCol(tx, uid);
        const key = cat + "_" + level, day = dayOf(g, "quizDay");
        if (!g.quizBest || typeof g.quizBest !== "object") g.quizBest = {};
        g.quizBest[key] = Math.max(g.quizBest[key] || 0, score);
        g.quizPts = Object.keys(g.quizBest).reduce((t, k) => t + (g.quizBest[k] || 0), 0);
        g.quizDone++; if (score === questions.length && questions.length >= core.QUIZ_N) { g.quizPerfect++; if (level === 4) g.quizL3++; }
        const gain = Math.max(0, Math.min(score * core.QUIZ_REWARD, core.QUIZ_DAILY_CAP - day.dust));
        core.seasonAdd(d, score * core.SEASON_PTS.quizOk + (score === questions.length ? core.SEASON_PTS.quizPerfect : 0), score >= 6 ? { quiz: 1 } : null, now());
        if (gain > 0) day.dust += gain, dustMove(d, gain, "Quiz");
        writeCol(tx, uid, d);
        writeStats(tx, uid, g);
        return { score, total: questions.length, reward: gain, best: g.quizBest[key], pts: g.quizPts, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- Quiz chrono : 60 s, classement hebdomadaire par niveau
    async function chronoStart(caller, data) {
      const uid = caller.uid, level = Math.max(1, Math.min(4, Number(data && data.level) | 0 || 1));
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), seed = (rng().toString(36).slice(2, 9) + rng().toString(36).slice(2, 9)).replace(/[^a-z0-9]/g, "a").padEnd(8, "a");
        g.chrono = { seed, level, t0: now() };
        writeStats(tx, uid, g);
        return { seed, level };
      });
    }
    async function chronoSubmit(caller, data) {
      const uid = caller.uid, pool = await getPool();
      const answers = (Array.isArray(data && data.answers) ? data.answers : []).slice(0, core.CHRONO.max).map((x) => Number(x) | 0);
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), d = await readCol(tx, uid), c = g.chrono;
        if (!c || !c.seed) fail("failed-precondition", "Aucune partie chrono en cours : relance-en une.");
        const el = (now() - c.t0) / 1000, qs = core.chronoQuestions(c.seed, c.level, pool.list);
        let ok = 0; answers.forEach((a, i) => { if (qs[i] && a === qs[i].a) ok++; });
        const wrong = answers.length - ok;
        g.chrono = null;
        if (el < core.CHRONO.secs - core.CHRONO.penalty * wrong - 4 || el < answers.length * 1.0 || el > core.CHRONO.secs + 120) { writeStats(tx, uid, g); fail("failed-precondition", "Partie chrono non valide (temps incohérent)."); }
        const day = dayOf(g, "chronoDay"), gain = Math.max(0, Math.min(ok * core.CHRONO.reward, core.CHRONO.cap - day.dust));
        if (!g.chronoBest || typeof g.chronoBest !== "object") g.chronoBest = {};
        g.chronoBest[c.level] = Math.max(g.chronoBest[c.level] || 0, ok);
        const f = core.chronoField(now(), c.level), pre = f.slice(0, 9);
        Object.keys(g).forEach((k) => { if (/^cw\d{4}W\d+L\d$/.test(k) && k.slice(0, 9) !== pre) delete g[k]; });
        g[f] = Math.max(Number(g[f]) || 0, ok);
        g.chronoDone = (g.chronoDone || 0) + 1;
        if (gain > 0) { day.dust += gain; dustMove(d, gain, "Quiz chrono"); }
        writeCol(tx, uid, d); writeStats(tx, uid, g);
        return { score: ok, wrong, reward: gain, best: g.chronoBest[c.level], weekBest: g[f], doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- quiz « survie » : 3 vies, temps par question décroissant
    async function survivalStart(caller, data) {
      const uid = caller.uid, level = Math.max(1, Math.min(4, Number(data && data.level) | 0 || 1));
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), seed = (rng().toString(36).slice(2, 9) + rng().toString(36).slice(2, 9)).replace(/[^a-z0-9]/g, "a").padEnd(8, "a");
        g.surv = { seed, level, t0: now() };
        writeStats(tx, uid, g);
        return { seed, level };
      });
    }
    async function survivalSubmit(caller, data) {
      const uid = caller.uid, pool = await getPool(), S = core.SURVIVAL;
      const answers = (Array.isArray(data && data.answers) ? data.answers : []).slice(0, S.max).map((x) => Math.max(-1, Math.min(3, Number(x) | 0)));
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), d = await readCol(tx, uid), c = g.surv;
        if (!c || !c.seed) fail("failed-precondition", "Aucune partie survie en cours : relance-en une.");
        const qs = core.survivalQuestions(c.seed, c.level, pool.list), res = core.survivalPlay(qs, answers), el = (now() - c.t0) / 1000;
        g.surv = null;
        // une partie ne peut pas aller plus vite qu'un humain ni durer plus que le temps accordé aux questions
        if (el < res.used * 0.8 - 1 || el > res.used * S.secs + 90) { writeStats(tx, uid, g); fail("failed-precondition", "Partie survie non valide (temps incohérent)."); }
        const day = dayOf(g, "survDay"), gain = Math.max(0, Math.min(res.ok * S.reward, S.cap - day.dust));
        if (!g.survBest || typeof g.survBest !== "object") g.survBest = {};
        const prev = g.survBest[c.level] || 0; g.survBest[c.level] = Math.max(prev, res.ok);
        g.survDone = (g.survDone || 0) + 1;
        if (gain > 0) { day.dust += gain; dustMove(d, gain, "Quiz survie"); }
        writeCol(tx, uid, d); writeStats(tx, uid, g);
        return { score: res.ok, wrong: res.wrong, reward: gain, best: g.survBest[c.level], record: res.ok > prev, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- marché de cartes (prix fixe en cristaux, 10 % de commission détruits)
    async function marketList(caller, data) {
      const uid = caller.uid, cardId = str(data && data.cardId, 90), price = Math.floor(Number(data && data.price)), pool = await getPool();
      if (!pool.byId.has(cardId)) fail("not-found", "Cette carte n'existe pas.");
      const rar = pool.rar.get(cardId);
      if (rar === "mythic") fail("failed-precondition", "Une carte Légende ne se vend pas.");
      const b = core.marketBounds(rar);
      if (!(price >= b.min && price <= b.max)) fail("invalid-argument", "Prix autorisé pour cette carte : de " + b.min + " à " + b.max + " cristaux.");
      if (await isMuted(uid)) fail("permission-denied", "Tu es en sourdine : le marché est suspendu pour toi.");
      const mine = (await col("card_listings").where("uid", "==", uid).limit(60).get()).docs.filter((x) => x.data().status === "open");
      if (mine.length >= core.MARKET_MAX_LISTINGS) fail("resource-exhausted", "Tu as déjà " + core.MARKET_MAX_LISTINGS + " cartes en vente.");
      const name = (await nameOf(uid)) || caller.name || "Pilote", label = await cardLabel(pool, cardId), ref = col("card_listings").doc();
      await db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if (core.isLocked(d, cardId)) fail("failed-precondition", "🔒 Cette carte est verrouillée : déverrouille-la pour la vendre.");
        if ((d.owned[cardId] || 0) < 2) fail("failed-precondition", "Tu ne peux vendre qu'un doublon : tu n'as qu'un exemplaire de cette carte.");
        d.owned[cardId]--; writeCol(tx, uid, d);
        tx.set(ref, { uid, name, cardId, label, rar, price, status: "open", createdAt: ts() });
      });
      // alerte « une carte de ta liste de souhaits est en vente »
      try {
        const ws = await col("wishlists").where("ids", "array-contains", cardId).limit(25).get();
        for (const w of ws.docs) if (w.id !== uid) await notify(w.id, { uid, name }, "🏷️ " + label + " (ta liste de souhaits) est en vente : " + price + " cristaux", "#/marche");
      } catch (_) { /* alerte facultative */ }
      return { id: ref.id };
    }
    async function marketBuy(caller, data) {
      const uid = caller.uid, ref = col("card_listings").doc(str(data && data.id, 128));
      let l = null, net = 0;
      await db.runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists) fail("not-found", "Cette annonce n'existe plus.");
        l = s.data();
        if (l.status !== "open") fail("failed-precondition", "Cette carte vient d'être vendue ou retirée.");
        if (l.uid === uid) fail("failed-precondition", "C'est ta propre annonce : tu peux l'annuler.");
        const buyer = await readCol(tx, uid), seller = await readCol(tx, l.uid), gb = await readStats(tx, uid), gs = await readStats(tx, l.uid);
        if (buyer.dust < l.price) fail("failed-precondition", "Il te faut " + l.price + " cristaux (tu en as " + buyer.dust + ").");
        net = core.marketNet(l.price);
        dustMove(buyer, -l.price, "Marché : achat"); buyer.owned[l.cardId] = (buyer.owned[l.cardId] || 0) + 1; core.histAdd(buyer, l.cardId, "market", now()); gb.bought++;
        dustMove(seller, net, "Marché : vente"); gs.sold++;
        writeCol(tx, uid, buyer); writeCol(tx, l.uid, seller); writeStats(tx, uid, gb); writeStats(tx, l.uid, gs);
        tx.update(ref, { status: "sold", buyerUid: uid, soldAt: ts() });
      });
      const me = (await nameOf(uid)) || caller.name || "Pilote";
      await notify(l.uid, { uid, name: me }, "💰 " + me + " t'a acheté " + l.label + " : +" + net + " cristaux", "#/marche");
      return { ok: true, cardId: l.cardId, price: l.price };
    }
    async function marketCancel(caller, data) {
      const uid = caller.uid, ref = col("card_listings").doc(str(data && data.id, 128));
      await db.runTransaction(async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists) fail("not-found", "Annonce introuvable.");
        const l = s.data();
        if (l.uid !== uid) fail("permission-denied", "Seul le vendeur peut retirer cette annonce.");
        if (l.status !== "open") fail("failed-precondition", "Cette annonce n'est plus en vente.");
        const d = await readCol(tx, uid);
        d.owned[l.cardId] = (d.owned[l.cardId] || 0) + 1; writeCol(tx, uid, d);
        tx.update(ref, { status: "cancelled", closedAt: ts() });
      });
      return { ok: true };
    }

    // ---------------------------------------------------------------- notifications pour les abonnés d'une voiture / d'une marque
    /** brands : familles de marques (« Peugeot »), cars : identifiants ; exceptUid : l'auteur, qui n'est pas prévenu */
    async function notifyFollowers(opts) {
      const seen = new Set(), text = str(opts.text, 120), link = opts.link || "#/nouveautes", from = opts.from || { name: "MOTORAUTO" };
      const run = async (field, val) => {
        try {
          const snap = await col("follows").where(field, "array-contains", val).limit(300).get();
          for (const f of snap.docs) { if (f.id === opts.exceptUid || seen.has(f.id)) continue; seen.add(f.id); await notify(f.id, from, text, link); }
        } catch (_) { /* abonnés facultatifs */ }
      };
      for (const b of (opts.brands || []).slice(0, 5)) await run("brands", b);
      for (const c of (opts.cars || []).slice(0, 10)) await run("cars", c);
      return seen.size;
    }
    /** chaque jour : prévient (au plus tous les 3 jours) les pilotes dont une carte de la liste de souhaits est en double chez un autre pilote */
    /** rareté réelle : part des pilotes qui possèdent chaque carte (recalculée chaque nuit) */
    async function computeCardStats() {
      const snap = await col("collections").limit(5000).get(), cnt = {}; let total = 0;
      snap.forEach((d) => { const o = d.data().owned || {}, ids = Object.keys(o).filter((id) => o[id] > 0); if (!ids.length) return; total++; ids.forEach((id) => { cnt[id] = (cnt[id] || 0) + 1; }); });
      const map = {}; Object.keys(cnt).forEach((id) => { map[id] = Math.round((cnt[id] / total) * 1000) / 10; });
      await col("config").doc("cardStats").set({ total, map, at: ts() });
      return { total, cards: Object.keys(map).length };
    }
    async function wishDigest() {
      const ws = (await col("wishlists").limit(300).get()).docs, cs = (await col("collections").limit(500).get()).docs;
      const owned = new Map(), dups = new Map();
      cs.forEach((c) => { const o = c.data().owned || {}; owned.set(c.id, o); Object.keys(o).forEach((id) => { if (o[id] >= 2) { if (!dups.has(id)) dups.set(id, []); dups.get(id).push(c.id); } }); });
      let sent = 0;
      for (const w of ws) {
        const mine = owned.get(w.id) || {}, ids = (w.data().ids || []).filter((id) => !(mine[id] > 0) && (dups.get(id) || []).some((u) => u !== w.id));
        if (!ids.length) continue;
        const gs = await col("gstats").doc(w.id).get(), at = gs.exists ? Number(gs.data().wishAt) || 0 : 0;
        if (now() - at < 3 * 86400000) continue;
        await notify(w.id, { name: "MOTORAUTO" }, "🎴 " + ids.length + " carte" + (ids.length > 1 ? "s" : "") + " de ta liste de souhaits " + (ids.length > 1 ? "sont disponibles" : "est disponible") + " chez d'autres pilotes", "#/souhaits");
        await col("gstats").doc(w.id).set({ wishAt: now() }, { merge: true });
        sent++;
      }
      return sent;
    }

    // ---------------------------------------------------------------- bataille de cartes entre joueurs (en direct, sans récompense)
    const BATTLE_INVITE_MS = 120000, BATTLE_TURN_MS = 90000;
    const BSTATS = [["power", 1], ["speed", 1], ["zero", -1]];
    const bval = (c, k) => Number(c && c[k]) || 0;
    const bBeats = (a, b, k) => Math.sign((a - b) * BSTATS.find((s) => s[0] === k)[1]);
    async function battleHand(uid, pool) {
      const s = await col("collections").doc(uid).get(), d = s.exists ? s.data() : {};
      return Object.keys(d.owned || {}).filter((id) => (d.owned[id] || 0) > 0).map((id) => pool.byId.get(id)).filter((c) => c && BSTATS.every(([k]) => bval(c, k) > 0)).map((c) => c.id);
    }
    const BRANK = ["special", "mythic", "shiny", "legendary", "epic", "rare", "common"];   // de la plus haute à la plus basse
    /** mains équilibrées : mêmes raretés des deux côtés (on prend les plus hautes raretés que les deux joueurs possèdent en assez grand nombre) */
    function balancedHands(ha, hb, pool, want) {
      const group = (ids) => { const g = {}; shuffled(ids).forEach((id) => { const r = pool.rar.get(id) || "common"; (g[r] = g[r] || []).push(id); }); return g; };
      const ga = group(ha), gb = group(hb), profile = [];
      BRANK.concat(Object.keys(ga).filter((r) => BRANK.indexOf(r) < 0)).forEach((r) => { const n = Math.min((ga[r] || []).length, (gb[r] || []).length); for (let i = 0; i < n; i++) profile.push(r); });
      const prof = profile.slice(0, want);
      if (prof.length < 3) return null;
      const pick = (g) => { const used = {}; return shuffled(prof.map((r) => { used[r] = (used[r] || 0) + 1; return g[r][used[r] - 1]; })); };
      return { a: pick(ga), b: pick(gb), profile: prof };
    }
    const shuffled = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = r[i]; r[i] = r[j]; r[j] = t; } return r; };
    async function readBattle(id, caller) {
      const ref = col("card_battles").doc(str(id, 60)), s = await ref.get();
      if (!s.exists) fail("not-found", "Bataille introuvable.");
      const b = s.data();
      if (!b.uids || b.uids.indexOf(caller.uid) < 0) fail("permission-denied", "Cette bataille ne te concerne pas.");
      return { ref, b };
    }
    const sideOf = (b, uid) => (b.a === uid ? "a" : "b");
    async function battleInvite(caller, data) {
      const to = str(data && data.to, 128);
      if (!to || to === caller.uid) fail("invalid-argument", "Choisis un autre pilote.");
      const toName = await nameOf(to);
      if (!toName) fail("not-found", "Pilote introuvable.");
      if (await isMuted(caller.uid)) fail("permission-denied", "Tu ne peux pas envoyer d'invitation pour le moment.");
      const pool = await getPool(), mine = await battleHand(caller.uid, pool), his = await battleHand(to, pool);
      if (mine.length < 3) fail("failed-precondition", "Il te faut au moins 3 cartes complètes (chevaux, vitesse max et 0 à 100).");
      if (his.length < 3) fail("failed-precondition", toName + " n'a pas encore 3 cartes complètes : la bataille est impossible.");
      if (!balancedHands(mine, his, pool, 5)) fail("failed-precondition", "Vous n'avez pas assez de cartes de même rareté en commun (au moins 3) pour une bataille équilibrée.");
      // une seule invitation en attente par pilote : la précédente est annulée
      const old = await col("card_battles").where("a", "==", caller.uid).get();
      for (const d of old.docs) { const x = d.data(); if (x.status === "pending") await d.ref.update({ status: "cancelled" }); }
      const myName = (await nameOf(caller.uid)) || str(caller.name, 40) || "Pilote";
      const t = now(), ref = col("card_battles").doc();
      await ref.set({ a: caller.uid, b: to, uids: [caller.uid, to], names: { a: myName, b: toName }, status: "pending", createdAt: t, expiresAt: t + BATTLE_INVITE_MS });
      const conv = [caller.uid, to].sort().join("_"), text = "⚔️ " + myName + " te défie à la bataille de cartes ! Réponds dans les 2 minutes.";
      try {
        await col("private_chats/" + conv + "/messages").add({ uid: caller.uid, pilot: myName, avatar: "", text, battleId: ref.id, timestamp: ts() });
        await col("private_chats").doc(conv).set({ uids: [caller.uid, to], lastUid: caller.uid, lastName: myName, lastText: text.slice(0, 160), lastAt: ts() });
      } catch (_) { /* le chat est facultatif : l'invitation reste valable */ }
      return { id: ref.id, expiresAt: t + BATTLE_INVITE_MS };
    }
    async function battleRespond(caller, data) {
      const { ref, b } = await readBattle(data && data.id, caller);
      if (b.b !== caller.uid) fail("permission-denied", "Seul le pilote invité peut répondre.");
      if (b.status !== "pending") fail("failed-precondition", b.status === "active" ? "Bataille déjà lancée." : "Cette invitation n'est plus valable.");
      if (now() > b.expiresAt) { await ref.update({ status: "expired" }); fail("failed-precondition", "L'invitation a expiré (2 minutes)."); }
      if (!(data && data.accept)) { await ref.update({ status: "declined" }); return { status: "declined" }; }
      const pool = await getPool(), ha = await battleHand(b.a, pool), hb = await battleHand(b.b, pool), bal = balancedHands(ha, hb, pool, 5);
      if (!bal) { await ref.update({ status: "cancelled" }); fail("failed-precondition", "Vous n'avez plus assez de cartes de même rareté pour une bataille équilibrée."); }
      const n = bal.profile.length;
      await ref.collection("hands").doc(b.a).set({ ids: bal.a });
      await ref.collection("hands").doc(b.b).set({ ids: bal.b });
      await ref.update({ status: "active", n, profile: bal.profile, round: 0, leader: rng() < 0.5 ? "a" : "b", phase: "lead", lead: null, used: { a: [], b: [] }, score: { a: 0, b: 0 }, last: null, hist: [], turnAt: now(), startedAt: now() });
      return { status: "active" };
    }
    const BR = { round: 6, win: 15, draw: 5, dayCap: 120, pairCap: 3, packRounds: 4 };
    /** fin normale d'une partie : cristaux selon les manches gagnées (plafonnés par jour et par adversaire), 1 pack bonus par jour pour une victoire nette */
    async function settleBattle(ref, b, score, winner) {
      const today = core.dayKey(now()), rw = { a: { dust: 0, pack: 0, capped: "" }, b: { dust: 0, pack: 0, capped: "" } };
      await db.runTransaction(async (tx) => {
        const cur = await tx.get(ref); if (!cur.exists || cur.data().status === "done") return;
        const d = {}, g = {};
        for (const sd of ["a", "b"]) { d[sd] = await readCol(tx, b[sd]); g[sd] = await readStats(tx, b[sd]); }
        for (const sd of ["a", "b"]) {
          const o = sd === "a" ? "b" : "a", pair = g[sd].bpPair && g[sd].bpPair.day === today ? g[sd].bpPair : { day: today, n: {} }, played = pair.n[b[o]] || 0;
          if (played >= BR.pairCap) rw[sd].capped = "pair";
          else {
            pair.n[b[o]] = played + 1;
            const want = score[sd] * BR.round + (winner === sd ? BR.win : winner === "" ? BR.draw : 0), day = dayOf(g[sd], "bpDay"), give = Math.max(0, Math.min(want, BR.dayCap - day.dust));
            day.dust += give; rw[sd].dust = give; if (give < want) rw[sd].capped = "day";
            if (winner === sd && score[sd] >= BR.packRounds && g[sd].bpPack !== today) { g[sd].bpPack = today; rw[sd].pack = 1; d[sd].bonus = (d[sd].bonus || 0) + 1; }
            dustMove(d[sd], give, "Bataille contre " + b.names[o]);
          }
          g[sd].bpPair = pair; writeCol(tx, b[sd], d[sd]); writeStats(tx, b[sd], g[sd]);
        }
        tx.update(ref, { status: "done", winner: winner || "", why: "score", doneAt: now(), reward: rw });
      });
    }
    async function finishBattle(ref, winner, why) { await ref.update({ status: "done", winner: winner || "", why: why || "", doneAt: now() }); }
    async function battleCancel(caller, data) {
      const { ref, b } = await readBattle(data && data.id, caller);
      if (b.status === "pending" && b.a === caller.uid) await ref.update({ status: "cancelled" });
      else if (b.status === "active") await finishBattle(ref, sideOf(b, caller.uid) === "a" ? "b" : "a", "forfeit");
      return { status: "ok" };
    }
    /** un tour : le meneur envoie { idx, stat } ; l'autre pilote répond { idx } ; la manche se règle, le répondeur mène la suivante */
    async function battlePlay(caller, data) {
      const { ref, b } = await readBattle(data && data.id, caller);
      if (b.status !== "active") fail("failed-precondition", "La bataille n'est pas en cours.");
      const me = sideOf(b, caller.uid), idx = Math.floor(Number(data && data.idx));
      const hs = await ref.collection("hands").doc(caller.uid).get(), mine = hs.exists ? hs.data().ids : [];
      if (b.phase === "lead" && b.leader !== me) fail("failed-precondition", "Ce n'est pas à toi de mener.");
      if (b.phase === "reply" && b.leader === me) fail("failed-precondition", "C'est à ton adversaire de répondre.");
      if (!(idx >= 0 && idx < mine.length) || b.used[me].indexOf(idx) >= 0) fail("invalid-argument", "Carte non jouable.");
      if (b.phase === "lead") {
        const stat = str(data && data.stat, 10);
        if (!BSTATS.some((s) => s[0] === stat)) fail("invalid-argument", "Choisis une caractéristique.");
        await ref.collection("hands").doc(caller.uid).set({ ids: mine, lead: { idx, id: mine[idx] } });   // la carte jouée reste secrète jusqu'au résultat
        await ref.update({ phase: "reply", lead: { stat }, turnAt: now() });
        return { status: "reply" };
      }
      if (b.phase !== "reply") fail("failed-precondition", "La bataille n'est pas en cours.");
      if (b.leader === me) fail("failed-precondition", "C'est à ton adversaire de répondre.");
      const pool = await getPool(), L = b.leader, k = b.lead.stat;
      const lh = await ref.collection("hands").doc(b[L]).get(), led = lh.exists ? lh.data().lead : null;
      if (!led) fail("failed-precondition", "Carte du meneur introuvable.");
      const lv = bval(pool.byId.get(led.id), k), rv = bval(pool.byId.get(mine[idx]), k), r = bBeats(lv, rv, k);
      const score = { a: b.score.a, b: b.score.b }, winner = r > 0 ? L : r < 0 ? me : "";
      if (winner) score[winner]++;
      const used = { a: b.used.a.slice(), b: b.used.b.slice() };
      used[L].push(led.idx); used[me].push(idx);
      const hist = (b.hist || []).concat([winner]), last = { round: b.round, lead: L, stat: k, ids: { [L]: led.id, [me]: mine[idx] }, vals: { [L]: lv, [me]: rv }, winner };
      const round = b.round + 1;
      if (round >= b.n) {
        await ref.update({ used, score, last, round, hist, phase: "end" });
        await settleBattle(ref, b, score, score.a > score.b ? "a" : score.b > score.a ? "b" : "");
        return { status: "done" };
      }
      await ref.update({ used, score, last, round, hist, leader: me, phase: "lead", lead: null, turnAt: now() });
      return { status: "next" };
    }
    const BEMOTES = ["gg", "bravo", "wow", "oups", "feu"];
    async function battleEmote(caller, data) {
      const { ref, b } = await readBattle(data && data.id, caller), k = str(data && data.e, 10);
      if (BEMOTES.indexOf(k) < 0 || (b.status !== "active" && b.status !== "done")) return { status: "ignored" };
      const me = sideOf(b, caller.uid);
      if (b.emote && b.emote.s === me && now() - b.emote.t < 1500) return { status: "ignored" };
      await ref.update({ emote: { s: me, k, t: now() } });
      return { status: "ok" };
    }
    /** le pilote qui attend peut déclarer forfait l'autre s'il ne joue plus depuis 90 s */
    async function battleClaim(caller, data) {
      const { ref, b } = await readBattle(data && data.id, caller);
      if (b.status === "pending" && now() > b.expiresAt) { await ref.update({ status: "expired" }); return { status: "expired" }; }
      if (b.status !== "active") return { status: b.status };
      const me = sideOf(b, caller.uid), waiting = b.phase === "lead" ? b.leader : (b.leader === "a" ? "b" : "a");
      if (waiting === me) fail("failed-precondition", "C'est à toi de jouer.");
      if (now() - b.turnAt < BATTLE_TURN_MS) fail("failed-precondition", "Ton adversaire a encore un peu de temps.");
      await finishBattle(ref, me, "timeout");
      return { status: "done" };
    }

    return { battleReport, battleDailyStart, closeDueContests, syncCollection, openPack, craftCard, upgradeCard, claimSets, touchStreak, buyFreeze, seasonClaim, claimWelcome, claimDayCard, clubClash, logAction, weeklyStatus, claimChallenge, cardChallenges, claimCardChallenge, battleInvite, battleRespond, battleCancel, battlePlay, battleClaim, battleEmote, proposeTrade, respondTrade, cancelTrade, claimSpecial, claimReferral, adminGameTool, adminBroadcast, adminGrantCard, adminContest, monthlyContest, fuseCards, pmPlay, quizSubmit, lockCard, recycleCards, spinWheel, openAdvent, chronoStart, chronoSubmit, survivalStart, survivalSubmit, marketList, marketBuy, marketCancel, notifyFollowers, wishDigest, computeCardStats, dailyReminder, _getPool: getPool };
  }
  return { createGame, GameError };
});
