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
    let poolCache = { at: 0, ids: [] };
    async function getPool() {
      if (poolCache.ids.length && now() - poolCache.at < 300000) return poolCache;
      const list = await deps.cardPool();
      if (!list.length) fail("unavailable", "Catalogue indisponible, réessaie dans un instant.");
      const rar = core.computeRarities(list);
      try { // raretés modifiées à la main par l'admin (config/rarities)
        const ov = await col("config").doc("rarities").get();
        const m = ov.exists ? ov.data().map || {} : {};
        Object.keys(m).forEach((id) => { if (rar.has(id) && core.ORDER.indexOf(m[id]) >= 0) rar.set(id, m[id]); });
      } catch (_) { /* pas de surcharge */ }
      poolCache = { at: now(), list, ids: list.map((c) => c.id), byId: new Map(list.map((c) => [c.id, c])), rar };
      return poolCache;
    }
    async function specialCard(id) { const s = await col("special_cards").doc(id).get(); return s.exists ? s.data() : null; }
    async function isKnownCard(pool, id) { return pool.byId.has(id) || (core.isSpecial(id) && !!(await specialCard(id))); }

    // ---------------------------------------------------------------- petits utilitaires
    const view = (d) => ({ owned: d.owned, count: d.count, specials: d.specials || 0, dust: d.dust, lastPack: d.lastPack, bonus: d.bonus, claimed: d.claimed, opened: d.opened, dustLog: d.dustLog || [], trades: d.trades || 0, chal: d.chal || 0, pics: d.pics || {}, picClaims: d.picClaims || {}, lv: d.lv || {}, mis: d.mis || { day: "", p: {}, done: [] }, offers: d.offers || { day: "", pack: 0, card: 0 } });
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
    async function notify(to, from, text, link) {
      try { await col("users/" + to + "/notifications").add({ type: "game", fromUid: from.uid || "motorauto", from: str(from.name || "MOTORAUTO", 40), text: str(text, 120), link: link || "#/jouer", read: false, createdAt: ts() }); } catch (_) { /* notification facultative */ }
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
      const stats = await gatherStats(uid, cur, pool.ids.length);
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

    async function openPack(caller, data) {
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
          if (def.country) {
            src = pool.ids.filter((id) => core.countryOf((pool.byId.get(id) || {}).brand) === def.country);
            if (src.length < 2) fail("failed-precondition", "Ce pack n'est pas disponible pour l'instant.");
          }
          if (d.dust < def.cost) fail("failed-precondition", "Il te faut " + def.cost + " cristaux pour ce pack (tu en as " + d.dust + ").");
          dustMove(d, -def.cost, def.country ? def.label + " acheté" : "Pack acheté");
        }
        const ids = kind === "shop" ? core.drawShopPack(pool.rar, src, rng, def.min) : core.drawPack(pool.rar, pool.ids, rng, (d.opened + 1) % 10 === 0, (d.opened + 1) % 30 === 0);
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
          d.owned[id] = had + 1;
          if (had === 0 && keys.length) d.pics[id] = [keys[0]];
          if (had > 0) dust += core.RAR[rar].dust;
          return { id, fresh: had === 0, rarity: rar, picTotal: keys.length };
        });
        if (bonus) dustMove(d, bonus, "Collection d'images");
        if (dust) dustMove(d, dust, kind === "shop" ? "Doublons du pack acheté" : "Doublons");
        if (kind !== "test") {
          const m1 = bump(d, "open"), m2 = kind === "shop" ? bump(d, "shop", def.country || "world") : { gain: 0, names: [] }, m3 = offerUsed ? bump(d, "offer") : { gain: 0, names: [] };
          missions = { gain: m1.gain + m2.gain + m3.gain, names: m1.names.concat(m2.names, m3.names) };
        }
        if (kind === "shop") { writeCol(tx, uid, d); return { cards, dust, bonus, missions, doc: view(d) }; }   // n'entre ni dans les packs ouverts, ni dans les défis
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
        dustMove(d, -cost, offerUsed ? "Carte du jour achetée" : "Carte fabriquée"); d.owned[id] = 1;
        const missions = offerUsed ? bump(d, "offer") : { gain: 0, names: [] };
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
        writeCol(tx, uid, d);
        return { id, level: cur + 1, cost, missions, doc: view(d) };
      });
    }

    // ---------------------------------------------------------------- sets de cartes complétés → cristaux + badge de set
    async function claimSets(caller) {
      const uid = caller.uid, pool = await getPool(), sets = core.setsOf(pool.list);
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), ref = col("set_claims").doc(uid), cs = await tx.get(ref), done = cs.exists ? Object.assign({}, cs.data().done || {}) : {};
        const won = [], legends = [];
        sets.forEach((st) => {
          if (done[st.id] || !st.ids.every((id) => (d.owned[id] || 0) > 0)) return;
          done[st.id] = now(); won.push({ id: st.id, name: st.name, reward: st.reward, legend: st.legend || "" });
          if (st.legend && pool.byId.has(st.legend)) {
            if ((d.owned[st.legend] || 0) > 0) dustMove(d, core.RAR.mythic.dust, "Légende déjà possédée");
            else { d.owned[st.legend] = 1; legends.push(st.legend); }
          }
        });
        if (!won.length) return { claimed: [], legends: [], doc: view(d), done };
        const total = won.reduce((t, w) => t + w.reward, 0);
        dustMove(d, total, "Album complété"); writeCol(tx, uid, d);
        tx.set(ref, { done, updatedAt: ts() });
        return { claimed: won, legends, total, doc: view(d), done };
      });
    }

    // ---------------------------------------------------------------- série de visites
    async function touchStreak(caller) {
      const uid = caller.uid, today = core.dayKey(now()), yesterday = core.dayKey(now() - 86400000);
      return db.runTransaction(async (tx) => {
        const ref = col("streaks").doc(uid), s = await tx.get(ref), cur = s.exists ? s.data() : null;
        if (cur && cur.last === today) return { days: cur.days || 1, best: Math.max(cur.best || 0, cur.days || 1), fresh: false };
        const days = cur && cur.last === yesterday ? (cur.days || 0) + 1 : 1, best = Math.max(days, (cur && cur.best) || 0);
        tx.set(ref, { days, best, last: today, updatedAt: ts() });
        return { days, best, fresh: true };
      });
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
      return core.autoFeatured(wk, pool.ids);
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
        writeCol(tx, uid, d); writeWeekly(tx, uid, w);
        return { reward: r, perfect, doc: view(d) };
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
      if ((mine[give] || 0) < 2) fail("failed-precondition", "Tu ne peux échanger qu'un doublon : tu n'as qu'un exemplaire de cette carte.");
      if ((mine[want] || 0) > 0) fail("failed-precondition", "Tu possèdes déjà la carte demandée.");
      if ((theirs[want] || 0) < 2) fail("failed-precondition", "Ce pilote n'a pas cette carte en double.");
      const open = (await col("trades").where("fromUid", "==", uid).limit(100).get()).docs.map((d) => d.data()).filter((t) => t.status === "open");
      if (open.length >= MAX_OPEN_TRADES) fail("resource-exhausted", "Tu as déjà " + MAX_OPEN_TRADES + " propositions en attente.");
      if (open.some((t) => t.toUid === to && t.give === give && t.want === want)) fail("already-exists", "Cette proposition existe déjà.");
      const ref = col("trades").doc();
      await ref.set({ fromUid: uid, fromName, toUid: to, toName, give, want, message, status: "open", createdAt: ts(), updatedAt: ts() });
      await notify(to, { uid, name: fromName }, fromName + " te propose un échange de cartes", "#/jouer/echanges");
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
        if ((from.owned[t.give] || 0) < 2 || (to.owned[t.want] || 0) < 2 || (from.owned[t.want] || 0) > 0) {
          ok = false; msg = "Les cartes ne sont plus disponibles : proposition annulée.";
          tx.update(ref, { status: "cancelled", updatedAt: ts() }); return;
        }
        from.owned[t.give]--; from.owned[t.want] = (from.owned[t.want] || 0) + 1;
        to.owned[t.want]--; to.owned[t.give] = (to.owned[t.give] || 0) + 1;
        from.trades = (from.trades || 0) + 1; to.trades = (to.trades || 0) + 1; wf.trades++; wt.trades++;
        bump(from, "trade"); bump(to, "trade");
        writeCol(tx, t.fromUid, from); writeCol(tx, uid, to); writeWeekly(tx, t.fromUid, wf); writeWeekly(tx, uid, wt);
        tx.update(ref, { status: "accepted", updatedAt: ts() });
      });
      const me = (await nameOf(uid)) || caller.name || "Pilote";
      if (ok) await settleTradeMessage(t, accept ? "accepted" : "declined", uid, me, accept ? "✅ Échange réalisé ! Les cartes ont changé de main." : "❌ Échange refusé.");
      else await settleTradeMessage(t, "cancelled", uid, me, "⚠️ Échange annulé : les cartes ne sont plus disponibles.");
      if (ok) await notify(t.fromUid, { uid, name: me }, accept ? me + " a accepté ton échange 🎉" : me + " a décliné ton échange", "#/jouer/echanges");
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
      if (mode === "grant") await notify(uid, { uid: caller.uid, name: "MOTORAUTO" }, "🎁 Tu as reçu la carte « " + label + " »", "#/jouer/cartes");
      return { ok: true, serials };
    }

    // ---------------------------------------------------------------- outils d'administration du jeu (tests, geste commercial)
    async function adminGameTool(caller, data) {
      await requireAdmin(caller);
      const action = str(data && data.action, 20), uid = str(data && data.uid, 128) || caller.uid;
      const qty = Math.max(1, Math.min(100000, Math.floor(Number(data && data.qty) || 1)));
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
      await notify(ref, { uid: caller.uid, name: me }, "🎁 " + me + " s'est inscrit grâce à toi : +1 pack bonus !", "#/jouer/cartes");
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
      return openContest(nowMonth);
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
    const blankStats = () => ({ fuse: 0, sold: 0, bought: 0, pmBest: 0, pmStreak: 0, pmPair: null, pmDay: { day: "", dust: 0 }, quizDone: 0, quizPerfect: 0, quizL3: 0, quizBest: {}, quizPts: 0, quizDay: { day: "", dust: 0 }, wishAt: 0 });
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
        const spare = (id) => (core.isSpecial(id) || pool.rar.get(id) !== from ? 0 : Math.max(0, (d.owned[id] || 0) - 1));
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
        d.owned[got] = (d.owned[got] || 0) + 1; g.fuse++;
        writeCol(tx, uid, d); writeStats(tx, uid, g);
        return { from, to, used, got, isNew: fresh.length > 0, fuse: g.fuse, doc: view(d) };
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
          const pick = data.pick === "b" ? "b" : "a", win = core.pmWinner(g.pmPair, pool.byId), pair = g.pmPair;
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
        if (!answer || (result && result.ok)) { next = core.pmPair(pool.list, rng, result ? result.pair : null); g.pmPair = next; }
        writeStats(tx, uid, g); if (reward) writeCol(tx, uid, d);
        return { result, next, streak: g.pmStreak, best: g.pmBest, reward, doc: reward ? view(d) : null };
      });
    }

    // ---------------------------------------------------------------- Quiz : le serveur rejoue les questions de la graine et corrige
    async function quizSubmit(caller, data) {
      const uid = caller.uid, pool = await getPool(), seed = str(data && data.seed, 40), cat = str(data && data.cat, 12), level = Math.max(1, Math.min(3, Number(data && data.level) | 0));
      if (!/^[\w-]{4,40}$/.test(seed)) fail("invalid-argument", "Quiz invalide.");
      if (!core.QCATS[cat]) fail("invalid-argument", "Catégorie inconnue.");
      const answers = (Array.isArray(data && data.answers) ? data.answers : []).slice(0, core.QUIZ_N).map((x) => Number(x) | 0);
      const questions = core.quizBuild(seed, cat, level, pool.list), score = core.quizScore(questions, answers);
      return db.runTransaction(async (tx) => {
        const g = await readStats(tx, uid), d = await readCol(tx, uid);
        const key = cat + "_" + level, day = dayOf(g, "quizDay");
        if (!g.quizBest || typeof g.quizBest !== "object") g.quizBest = {};
        g.quizBest[key] = Math.max(g.quizBest[key] || 0, score);
        g.quizPts = Object.keys(g.quizBest).reduce((t, k) => t + (g.quizBest[k] || 0), 0);
        g.quizDone++; if (score === questions.length && questions.length >= core.QUIZ_N) { g.quizPerfect++; if (level === 3) g.quizL3++; }
        const gain = Math.max(0, Math.min(score * core.QUIZ_REWARD, core.QUIZ_DAILY_CAP - day.dust));
        if (gain > 0) { day.dust += gain; dustMove(d, gain, "Quiz"); writeCol(tx, uid, d); }
        writeStats(tx, uid, g);
        return { score, total: questions.length, reward: gain, best: g.quizBest[key], pts: g.quizPts, doc: gain > 0 ? view(d) : null };
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
        dustMove(buyer, -l.price, "Marché : achat"); buyer.owned[l.cardId] = (buyer.owned[l.cardId] || 0) + 1; gb.bought++;
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

    return { closeDueContests, syncCollection, openPack, craftCard, upgradeCard, claimSets, touchStreak, logAction, weeklyStatus, claimChallenge, proposeTrade, respondTrade, cancelTrade, claimSpecial, claimReferral, adminGameTool, adminBroadcast, adminGrantCard, adminContest, monthlyContest, fuseCards, pmPlay, quizSubmit, marketList, marketBuy, marketCancel, notifyFollowers, wishDigest, _getPool: getPool };
  }
  return { createGame, GameError };
});
