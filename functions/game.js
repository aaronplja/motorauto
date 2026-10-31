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
      poolCache = { at: now(), list, ids: list.map((c) => c.id), byId: new Map(list.map((c) => [c.id, c])), rar: core.computeRarities(list) };
      return poolCache;
    }
    async function specialCard(id) { const s = await col("special_cards").doc(id).get(); return s.exists ? s.data() : null; }
    async function isKnownCard(pool, id) { return pool.byId.has(id) || (core.isSpecial(id) && !!(await specialCard(id))); }

    // ---------------------------------------------------------------- petits utilitaires
    const view = (d) => ({ owned: d.owned, count: d.count, specials: d.specials || 0, dust: d.dust, lastPack: d.lastPack, bonus: d.bonus, claimed: d.claimed, opened: d.opened, trades: d.trades || 0, chal: d.chal || 0 });
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
      if (kind !== "daily" && kind !== "bonus" && kind !== "test") fail("invalid-argument", "Type de pack inconnu.");
      if (kind === "test") await requireAdmin(caller);   // pack de test illimité : réservé à l'administration, sans effet sur les défis ni les compteurs
      const pool = await getPool(), today = core.dayKey(now()), wk = core.weekKey(now());
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), w = await readWeekly(tx, uid, wk);
        if (kind === "daily" && d.lastPack === today) fail("failed-precondition", "Ton pack du jour est déjà ouvert : reviens demain !");
        if (kind === "bonus" && d.bonus < 1) fail("failed-precondition", "Aucun pack bonus disponible.");
        const ids = core.drawPack(pool.rar, pool.ids, rng, (d.opened + 1) % 10 === 0);
        let dust = 0;
        const cards = ids.map((id) => {
          const had = d.owned[id] || 0; d.owned[id] = had + 1;
          const rar = pool.rar.get(id);
          if (had > 0) dust += core.RAR[rar].dust;
          return { id, fresh: had === 0, rarity: rar };
        });
        d.dust += dust;
        if (kind === "test") { core.recount(d); writeCol(tx, uid, d); return { cards, dust, doc: view(d), test: true }; }
        if (kind === "daily") { d.lastPack = today; if (w.dailyDays.indexOf(today) < 0) w.dailyDays.push(today); } else d.bonus--;
        d.opened++; w.packs++;
        writeCol(tx, uid, d); writeWeekly(tx, uid, w);
        return { cards, dust, doc: view(d) };
      });
    }

    async function craftCard(caller, data) {
      const uid = caller.uid, id = str(data && data.id, 90), pool = await getPool();
      if (!pool.byId.has(id)) fail("not-found", "Cette carte n'existe pas.");
      const cost = core.RAR[pool.rar.get(id)].craft;
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid);
        if ((d.owned[id] || 0) > 0) fail("failed-precondition", "Tu possèdes déjà cette carte.");
        if (d.dust < cost) fail("failed-precondition", "Il te faut " + cost + " poussière (tu en as " + d.dust + ").");
        d.dust -= cost; d.owned[id] = 1;
        writeCol(tx, uid, d);
        return { id, doc: view(d) };
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
    const LOGS = ["duel", "share"];
    async function logAction(caller, data) {
      const type = data && data.type, uid = caller.uid, today = core.dayKey(now()), wk = core.weekKey(now());
      if (LOGS.indexOf(type) < 0) fail("invalid-argument", "Action inconnue.");
      return db.runTransaction(async (tx) => {
        const w = await readWeekly(tx, uid, wk), cur = w.logDay[type] || { day: "", n: 0 };
        const n = cur.day === today ? cur.n : 0;
        if (n >= 3) return { counted: false };
        w.logDay[type] = { day: today, n: n + 1 }; w.logs[type] = (w.logs[type] || 0) + 1;
        writeWeekly(tx, uid, w);
        return { counted: true };
      });
    }
    async function countSince(name, field, uid, start, tsField) {
      let r; try { r = await col(name).where(field, "==", uid).limit(500).get(); } catch (_) { return 0; }
      return r.docs.filter((d) => tsMs(d.data()[tsField || "createdAt"]) >= start).length;
    }
    /** valeurs des défis fondés sur les données du site (le reste vient du compteur hebdomadaire) */
    async function queryValues(uid, items, since) {
      const start = since != null ? since : core.weekStart(now()), out = {};
      for (const ch of items) {
        const src = ch.src;
        if (src === "q:comments") out[ch.id] = await countSince("comments", "uid", uid, start);
        else if (src === "q:laps") out[ch.id] = await countSince("global_laps", "pilotUid", uid, start);
        else if (src === "q:likes") out[ch.id] = await countSince("likes", "uid", uid, start);
        else if (src === "q:reacts") out[ch.id] = await countSince("reactions", "uid", uid, start);
        else if (src === "q:chat") out[ch.id] = await countSince("global_chat", "uid", uid, start, "timestamp");
        else if (src === "q:rsvps") out[ch.id] = await countSince("rsvps", "uid", uid, start);
        else if (src === "q:votes") out[ch.id] = await countSince("contest_votes", "uid", uid, start);
        else if (src === "state:wish") { const s = await col("wishlists").doc(uid).get(); out[ch.id] = s.exists && Array.isArray(s.data().ids) ? s.data().ids.length : 0; }
      }
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
      const [w, qv, dqv] = await Promise.all([col("weekly").doc(uid).get().then((s) => normWeekly(s, wk)), queryValues(uid, items), queryValues(uid, [dch], dayStartMs())]);
      const list = items.map((ch) => { const v = Math.min(ch.goal, valueOf(ch, w, qv)); return { id: ch.id, icon: ch.icon, label: ch.label, goal: ch.goal, value: v, done: v >= ch.goal, claimed: w.claimed.indexOf(ch.id) >= 0, reward: ch.reward }; });
      const dv = Math.min(dch.goal, valueOf(dch, w, dqv, true));
      const daily = { id: dch.id, icon: dch.icon, label: dch.label, goal: dch.goal, value: dv, done: dv >= dch.goal, claimed: (w.claimedDaily || []).indexOf(today + ":" + dch.id) >= 0, reward: dch.reward, day: today };
      return { week: wk, endsAt: core.weekEnd(now()), items: list, daily, perfectBonus: core.PERFECT_WEEK_BONUS, allClaimed: list.every((x) => x.claimed) };
    }
    async function claimChallenge(caller, data) {
      const uid = caller.uid, wk = core.weekKey(now()), items = core.weekChallenges(wk), id = str(data && data.id, 40), today = core.dayKey(now());
      const isDaily = id.indexOf("d-") === 0, dch = core.dailyChallenge(today);
      const ch = isDaily ? (dch.id === id ? dch : null) : items.find((c) => c.id === id);
      if (!ch) fail("not-found", isDaily ? "Ce n'est pas le défi du jour." : "Ce défi ne fait pas partie de la semaine en cours.");
      const qv = await queryValues(uid, [ch], isDaily ? dayStartMs() : null);
      return db.runTransaction(async (tx) => {
        const d = await readCol(tx, uid), w = await readWeekly(tx, uid, wk);
        const key = today + ":" + id;
        if (isDaily ? (w.claimedDaily || []).indexOf(key) >= 0 : w.claimed.indexOf(id) >= 0) fail("failed-precondition", "Récompense déjà récupérée.");
        if (valueOf(ch, w, qv, isDaily) < ch.goal) fail("failed-precondition", "Défi pas encore accompli.");
        const r = ch.reward; let perfect = false;
        if (r.dust) d.dust += r.dust;
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
      const results = ranked.slice(0, 3).map((r) => ({ entry: r.e.id, uid: r.e.uid, name: str(r.e.name, 40), photo: str(r.e.photo, 500), votes: r.votes }));
      const custom = !/^\d{4}-\d{2}$/.test(month), win = ranked[0] ? ranked[0].e : null, label = custom ? str(cs.data().theme, 40) : core.monthLabel(month);
      if (win) {
        const sid = "sp-photo-" + month;
        await col("special_cards").doc(sid).set({ name: custom ? "Gagnant du concours" : "Photographe du mois", edition: "Concours photo · " + label, image: str(win.photo, 500), color: "gold", power: 0, speed: 0, zero: 0,
          text: "« " + str(win.caption || cs.data().theme, 100) + " » — photo de " + str(win.name, 40), supply: 1, granted: 0, active: true, kind: "contest", createdAt: ts() });
        await adminGrantCard({ uid: "system", system: true }, { uid: win.uid, cardId: sid, qty: 1 });
        const dustTo = [null, 150, 80];
        for (let i = 1; i < results.length; i++) {
          await db.runTransaction(async (tx) => { const d = await readCol(tx, results[i].uid); d.dust += dustTo[i]; writeCol(tx, results[i].uid, d); });
          await notify(results[i].uid, { name: "MOTORAUTO" }, "📸 " + (i + 1) + "e du concours photo de " + label + " : +" + dustTo[i] + " ✨", "#/jouer/concours");
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

    return { closeDueContests, syncCollection, openPack, craftCard, touchStreak, logAction, weeklyStatus, claimChallenge, proposeTrade, respondTrade, cancelTrade, claimSpecial, claimReferral, adminGameTool, adminBroadcast, adminGrantCard, adminContest, monthlyContest, _getPool: getPool };
  }
  return { createGame, GameError };
});
