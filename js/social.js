/**
 * MOTORAUTO — réactions : j'aime, commentaires, notes (plaisir / fiabilité / entretien),
 * « voir aussi », galerie & historique d'une fiche, classement « les plus aimées ».
 *
 * Collections (toutes à la racine, pas de requête de groupe) :
 *   likes/{kind}_{target}_{uid}      { kind, target, uid, createdAt }
 *   comments/{auto}                  { kind, target, uid, pilot, avatar, text, createdAt }
 *   votes/{kind}_{target}_{uid}      { kind, target, uid, fun, reliability, cost, updatedAt }
 * kind : "cat" (fiche du catalogue) ou "com" (voiture d'un pilote).
 */
(function () {
  "use strict";
  const CRITERIA = [["fun", "Plaisir de conduite"], ["reliability", "Fiabilité"], ["cost", "Coût d'entretien (5 = abordable)"]];
  // familles de déclinaisons connues : chaque fiche renvoie vers les autres
  const FAMILIES = [
    ["nissan-silvia-classic", "nissan-silvia-s13", "nissan-silvia-ps13", "nissan-onevia", "nissan-sileighty", "nissan-silvia-s14", "nissan-silvia-s15"],
    ["nissan-skyline-gtr-classic", "nissan-skyline-gtr-r32", "nissan-skyline-gtr-r33", "nissan-skyline-gtr-r34", "nissan-gt-r-r35"],
    ["nissan-s30-240z-280z", "nissan-s130-280zx", "nissan-z31-300zx", "nissan-z32-300zx", "nissan-350z-z33", "nissan-370z-z34", "nissan-z-rz34"],
    ["peugeot-106-s16", "peugeot-206-s16-gt", "peugeot-206-quiksilver", "peugeot-306-s16"]
  ];

  const likes = new Map();     // "kind:target" -> Set(uid)
  const votes = new Map();     // "kind:target" -> Map(uid -> {fun,reliability,cost})
  const comments = new Map();  // "kind:target" -> [{id,...}]
  const reacts = new Map();    // "kind:target" -> Map(uid -> emojiId)
  const EMOJIS = [["fire", "🔥", "Canon"], ["flag", "🏁", "À piloter"], ["love", "😍", "Coup de cœur"]];
  let loaded = false, loading = null, C = null;

  const key = (kind, target) => kind + ":" + target;
  const docId = (kind, target, uid) => kind + "_" + target + "_" + uid;
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const tsMs = (t) => (t && t.toMillis ? t.toMillis() : t && t.seconds ? t.seconds * 1000 : typeof t === "number" ? t : Date.now());

  function carStats(kind, target) {
    const k = key(kind, target);
    const L = likes.get(k), V = votes.get(k), M = comments.get(k);
    const vs = V ? Array.from(V.values()) : [];
    const avgOf = (f) => mean(vs.map((v) => v[f]).filter((n) => n > 0));
    const fun = avgOf("fun"), reliability = avgOf("reliability"), cost = avgOf("cost");
    const per = [fun, reliability, cost].filter((n) => n > 0);
    return {
      likes: L ? L.size : 0, liked: !!(C && C.user && L && L.has(C.user.uid)),
      votes: vs.length, fun, reliability, cost, avg: mean(per),
      comments: M ? M.length : 0, mine: (C && C.user && V && V.get(C.user.uid)) || null
    };
  }

  const notify = () => document.dispatchEvent(new CustomEvent("ma:social"));
  const muted = () => !!(window.MAMute && window.MAMute.active && window.MAMute.active());
  function guardWrite() {
    if (!C.requireLogin()) return false;
    if (muted()) { C.toast(window.MAMute.message(), "err"); return false; }
    return true;
  }

  async function loadStats(force) {
    if (loaded && !force) return;
    if (loading) return loading;
    loading = (async () => {
      try {
        const [l, v, m, r] = await Promise.all([
          C.db.collection("likes").limit(5000).get(),
          C.db.collection("votes").limit(5000).get(),
          C.db.collection("comments").limit(3000).get(),
          C.db.collection("reactions").limit(5000).get().catch(() => null)
        ]);
        likes.clear(); votes.clear(); comments.clear(); reacts.clear();
        if (r) r.forEach((d) => { const x = d.data(); const k = key(x.kind, x.target); if (!reacts.has(k)) reacts.set(k, new Map()); reacts.get(k).set(x.uid, x.emoji); });
        l.forEach((d) => { const x = d.data(); const k = key(x.kind, x.target); if (!likes.has(k)) likes.set(k, new Set()); likes.get(k).add(x.uid); });
        v.forEach((d) => { const x = d.data(); const k = key(x.kind, x.target); if (!votes.has(k)) votes.set(k, new Map()); votes.get(k).set(x.uid, x); });
        m.forEach((d) => { const x = Object.assign({ id: d.id }, d.data()); const k = key(x.kind, x.target); if (!comments.has(k)) comments.set(k, []); comments.get(k).push(x); });
        comments.forEach((arr) => arr.sort((a, b) => tsMs(a.createdAt) - tsMs(b.createdAt)));
        loaded = true;
        notify();
      } catch (e) { console.warn("Réactions indisponibles :", e.message); }
      finally { loading = null; }
    })();
    return loading;
  }

  // ------------------------------------------------------------ actions
  async function toggleLike(kind, target, ctxInfo) {
    if (!guardWrite()) return;
    const k = key(kind, target), me = C.user.uid;
    if (!likes.has(k)) likes.set(k, new Set());
    const set = likes.get(k), had = set.has(me);
    if (had) set.delete(me); else set.add(me);
    notify();
    try {
      const ref = C.db.collection("likes").doc(docId(kind, target, me));
      if (had) await ref.delete();
      else {
        await ref.set({ kind, target, uid: me, createdAt: C.FieldValue.serverTimestamp() });
        if (ctxInfo && ctxInfo.ownerUid && ctxInfo.ownerUid !== me) {
          C.MA.notif.send(ctxInfo.ownerUid, { type: "like", from: C.pilotName(), text: ctxInfo.title, link: ctxInfo.link }, "like_" + kind + "_" + target + "_" + me);
        }
      }
    } catch (e) {
      if (had) set.add(me); else set.delete(me);
      notify();
      C.toast("Impossible d'enregistrer le j'aime : " + e.message, "err");
    }
  }

  async function setReaction(kind, target, emoji) {
    if (!guardWrite()) return;
    const k = key(kind, target), me = C.user.uid;
    if (!reacts.has(k)) reacts.set(k, new Map());
    const m = reacts.get(k), prev = m.get(me) || null, ref = C.db.collection("reactions").doc(docId(kind, target, me));
    const next = prev === emoji ? null : emoji;
    if (next) m.set(me, next); else m.delete(me);
    notify();
    try {
      if (!next) await ref.delete();
      else await ref.set({ kind, target, uid: me, emoji: next, createdAt: C.FieldValue.serverTimestamp() });
    } catch (e) {
      if (prev) m.set(me, prev); else m.delete(me);
      notify(); C.toast("Réaction refusée : " + e.message, "err");
    }
  }

  async function saveVote(kind, target, field, value) {
    if (!guardWrite()) return;
    const k = key(kind, target), me = C.user.uid;
    if (!votes.has(k)) votes.set(k, new Map());
    const prev = votes.get(k).get(me) || { kind, target, uid: me, fun: 0, reliability: 0, cost: 0 };
    const next = Object.assign({}, prev, { [field]: value });
    votes.get(k).set(me, next);
    notify();
    try {
      await C.db.collection("votes").doc(docId(kind, target, me)).set({
        kind, target, uid: me, fun: next.fun || 0, reliability: next.reliability || 0, cost: next.cost || 0, updatedAt: C.FieldValue.serverTimestamp()
      });
    } catch (e) { votes.get(k).set(me, prev); notify(); C.toast("Note non enregistrée : " + e.message, "err"); }
  }

  // ------------------------------------------------------------ mentions @pseudo dans les commentaires
  let pilotsCache = null, pilotsLoading = null;
  function loadPilots() {
    if (pilotsCache) return Promise.resolve(pilotsCache);
    if (!pilotsLoading) pilotsLoading = C.db.collection("users").limit(500).get()
      .then((snap) => { pilotsCache = snap.docs.map((d) => ({ id: d.id, username: d.data().username || "", avatar: d.data().avatar || "" })).filter((p) => p.username); return pilotsCache; })
      .catch(() => { pilotsCache = []; return pilotsCache; });
    return pilotsLoading;
  }
  const mentionHtml = (text) => C.esc(text).replace(/(^|[\s(>])@([\p{L}\p{N}_.-]{2,24})/gu, (_, pre, tok) => {
    const me = C.user && C.profile && C.profile.username ? C.MA.mentionToken(C.profile.username).toLowerCase() : "";
    return `${pre}<span class="mention${tok.toLowerCase() === me ? " me" : ""}">@${tok}</span>`;
  });
  let pop = null, popInput = null, popList = [], popIdx = 0;
  function hidePop() { if (pop) { pop.hidden = true; } popList = []; }
  async function updatePop(input) {
    const pos = input.selectionStart == null ? input.value.length : input.selectionStart;
    const m = input.value.slice(0, pos).match(/(^|\s)@([\p{L}\p{N}_.-]{0,24})$/u);
    if (!m) { hidePop(); return; }
    const q = m[2].toLowerCase(), all = await loadPilots();
    popList = all.filter((p) => C.MA.mentionToken(p.username).toLowerCase().startsWith(q) && (!C.user || p.id !== C.user.uid)).slice(0, 5);
    if (!popList.length) { hidePop(); return; }
    if (!pop) { pop = document.createElement("div"); pop.className = "mention-pop cmt-mention-pop"; pop.setAttribute("role", "listbox"); document.body.appendChild(pop);
      pop.addEventListener("mousedown", (e) => { const b = e.target.closest("button[data-i]"); if (b) { e.preventDefault(); pickPop(Number(b.dataset.i)); } }); }
    popInput = input; popIdx = 0;
    pop.innerHTML = popList.map((p, i) => `<button type="button" role="option" class="${i === 0 ? "on" : ""}" data-i="${i}"><img src="${C.esc(C.safeUrl(p.avatar) || "")}" alt="" data-fallback="avatar"><span>${C.esc(p.username)}</span></button>`).join("");
    const r = input.getBoundingClientRect();
    pop.style.cssText = `position:fixed;left:${Math.round(r.left)}px;top:${Math.round(r.bottom + 6)}px;width:${Math.round(Math.min(r.width, 320))}px;z-index:3000`;
    pop.hidden = false;
  }
  function pickPop(i) {
    const p = popList[i]; if (!p || !popInput) return;
    const pos = popInput.selectionStart == null ? popInput.value.length : popInput.selectionStart;
    const before = popInput.value.slice(0, pos).replace(/@([\p{L}\p{N}_.-]{0,24})$/u, "@" + C.MA.mentionToken(p.username) + " ");
    popInput.value = before + popInput.value.slice(pos); popInput.focus();
    popInput.setSelectionRange(before.length, before.length); hidePop();
  }
  document.addEventListener("input", (e) => { const t = e.target; if (t && t.matches && t.matches(".cmt-form input[type=text]")) updatePop(t); });
  document.addEventListener("keydown", (e) => {
    if (!pop || pop.hidden || !popList.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); popIdx = (popIdx + (e.key === "ArrowDown" ? 1 : -1) + popList.length) % popList.length; pop.querySelectorAll("button").forEach((b, i) => b.classList.toggle("on", i === popIdx)); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); e.stopPropagation(); pickPop(popIdx); }
    else if (e.key === "Escape") hidePop();
  }, true);
  document.addEventListener("click", (e) => { if (!e.target.closest(".cmt-form, .cmt-mention-pop")) hidePop(); });

  async function addComment(kind, target, text, ctxInfo) {
    text = String(text || "").trim().slice(0, 500);
    if (!text || !guardWrite()) return false;
    const doc = {
      kind, target, uid: C.user.uid, pilot: C.pilotName().slice(0, 40), avatar: String((C.profile && C.profile.avatar) || "").slice(0, 400),
      text, createdAt: C.FieldValue.serverTimestamp()
    };
    try {
      const ref = await C.db.collection("comments").add(doc);
      const k = key(kind, target);
      if (!comments.has(k)) comments.set(k, []);
      comments.get(k).push(Object.assign({ id: ref.id }, doc, { createdAt: Date.now() }));
      // prévient le propriétaire (voiture de pilote) puis les autres commentateurs
      const targets = new Set();
      if (ctxInfo && ctxInfo.ownerUid) targets.add(ctxInfo.ownerUid);
      comments.get(k).forEach((c) => targets.add(c.uid));
      targets.delete(C.user.uid);
      targets.forEach((uid) => C.MA.notif.send(uid, { type: "comment", from: C.pilotName(), text: (ctxInfo ? ctxInfo.title + " : " : "") + text, link: ctxInfo && ctxInfo.link }, "comment_" + kind + "_" + target + "_" + C.user.uid));
      // pilotes tagués (@pseudo) : notification « mention », prioritaire sur la notification de commentaire
      try {
        const tagged = C.MA.parseMentions(text), all = tagged.length ? await loadPilots() : [];
        tagged.forEach((tok) => {
          const p = all.find((x) => C.MA.mentionToken(x.username).toLowerCase() === tok);
          if (p && p.id !== C.user.uid) C.MA.notif.send(p.id, { type: "mention", from: C.pilotName(), text: (ctxInfo ? ctxInfo.title + " : " : "") + text, link: ctxInfo && ctxInfo.link });
        });
      } catch (_) { /* mention non envoyée */ }
      notify();
      return true;
    } catch (e) { C.toast("Commentaire refusé : " + e.message, "err"); return false; }
  }

  async function deleteComment(kind, target, id) {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await C.db.collection("comments").doc(id).delete();
      const k = key(kind, target);
      comments.set(k, (comments.get(k) || []).filter((c) => c.id !== id));
      if (C.isAdmin && window.MALog) window.MALog.log("comment-delete", { target: kind + ":" + target, detail: "commentaire supprimé" });
      notify();
    } catch (e) { C.toast("Suppression impossible : " + e.message, "err"); }
  }

  // ------------------------------------------------------------ rendu
  function ago(ms) {
    const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
    if (s < 60) return "à l'instant";
    if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
    if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
    return `il y a ${Math.floor(s / 86400)} j`;
  }
  const f1 = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");

  function socialHtml(kind, target) {
    const s = carStats(kind, target), esc = C.esc;
    const list = comments.get(key(kind, target)) || [];
    const stars = (field) => {
      const mine = (s.mine && s.mine[field]) || 0;
      const avg = s[field];
      return `<div class="rate-row"><span>${esc(CRITERIA.find((c) => c[0] === field)[1])}</span>
        <div class="stars" role="radiogroup" aria-label="${esc(CRITERIA.find((c) => c[0] === field)[1])}">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="star ${n <= mine ? "on" : ""}" role="radio" aria-checked="${n === mine}" data-rate="${field}" data-v="${n}" aria-label="${n} sur 5">★</button>`).join("")}</div>
        <span class="rate-avg">${avg ? "Moyenne " + f1(avg) + " / 5" : "Pas encore de note"}${s.votes ? " · " + s.votes + " vote" + (s.votes > 1 ? "s" : "") : ""}</span></div>`;
    };
    return `
      <div class="social-bar">
        <button type="button" class="like-btn ${s.liked ? "on" : ""}" data-soc="like" aria-pressed="${s.liked}"><span class="heart" aria-hidden="true">${s.liked ? "♥" : "♡"}</span> <span>${s.likes}</span> <span class="sr-only">j'aime</span></button>
        <a class="cmt-toggle" href="#cmt-${esc(kind)}" data-soc="goto-cmt">💬 ${list.length}<span class="sr-only"> commentaires</span></a>
        ${s.votes ? `<span class="due" title="Moyenne des notes">★ ${f1(s.avg)} / 5</span>` : ""}
      </div>
      <div class="react-row" role="group" aria-label="Réactions rapides">${EMOJIS.map(([id, ch, tip]) => {
        const m = reacts.get(key(kind, target)), n = m ? Array.from(m.values()).filter((x) => x === id).length : 0, on = !!(C.user && m && m.get(C.user.uid) === id);
        return `<button type="button" class="react-btn ${on ? "on" : ""}" data-react="${id}" aria-pressed="${on}" title="${esc(tip)}"><span aria-hidden="true">${ch}</span><b>${n}</b><span class="sr-only"> ${esc(tip)}</span></button>`;
      }).join("")}</div>
      <div class="rating-box" aria-label="Notes de la communauté">${CRITERIA.map((c) => stars(c[0])).join("")}</div>
      <section class="comments-box" id="cmt-${esc(kind)}" aria-label="Commentaires">
        <h3>Commentaires (${list.length})</h3>
        <div class="cmt-list">${list.length ? list.map((c) => `
          <div class="cmt"><img src="${esc(C.safeUrl(c.avatar) || "")}" alt="" data-fallback="avatar">
            <div class="cmt-body"><b data-soc="profile" data-uid="${esc(c.uid)}">${esc(c.pilot || "Pilote")}</b>${C.MA.admins ? C.MA.admins.tag(c.uid) : ""}<small>${ago(tsMs(c.createdAt))}</small>
              ${(C.user && (C.user.uid === c.uid || C.isAdmin)) ? `<button type="button" class="cmt-del" data-soc="del" data-id="${esc(c.id)}" aria-label="Supprimer le commentaire" title="Supprimer">🗑</button>` : ""}
              <div>${mentionHtml(c.text)}</div></div></div>`).join("") : `<div class="empty-note small">Aucun commentaire. Sois le premier !</div>`}</div>
        <form class="cmt-form" data-soc="form">
          <input type="text" maxlength="500" placeholder="${C.user ? "Écris un commentaire…" : "Connecte-toi pour commenter"}" aria-label="Ton commentaire" ${C.user ? "" : "disabled"}>
          <button type="submit" class="cta-btn fill-btn compact-btn">${C.user ? "Publier" : "Connexion"}</button>
        </form>
      </section>`;
  }

  /** monte le bloc social dans un conteneur ; se redessine à chaque changement */
  function mount(el, kind, target, info) {
    if (!el) return;
    el._soc = { kind, target, info };
    const draw = () => {
      if (!document.body.contains(el)) { document.removeEventListener("ma:social", draw); return; }
      const active = document.activeElement;
      const typing = active && el.contains(active) && active.matches(".cmt-form input") ? active.value : null;
      el.innerHTML = socialHtml(kind, target);
      if (typing != null) { const i = el.querySelector(".cmt-form input"); i.value = typing; i.focus(); }
    };
    if (el._socDraw) document.removeEventListener("ma:social", el._socDraw);
    el._socDraw = draw;
    document.addEventListener("ma:social", draw);
    draw();
    if (!el._socBound) {
      el._socBound = true;
      el.addEventListener("click", (e) => {
        const t = e.target.closest("[data-soc],[data-rate],[data-react]");
        if (!t) return;
        const { kind, target, info } = el._soc;
        if (t.dataset.react) { setReaction(kind, target, t.dataset.react); return; }
        if (t.dataset.rate) { saveVote(kind, target, t.dataset.rate, Number(t.dataset.v)); return; }
        if (t.dataset.soc === "like") toggleLike(kind, target, info);
        else if (t.dataset.soc === "del") deleteComment(kind, target, t.dataset.id);
        else if (t.dataset.soc === "profile") C.openProfile(t.dataset.uid);
        else if (t.dataset.soc === "goto-cmt") { e.preventDefault(); const b = el.querySelector(".comments-box"); if (b) { b.scrollIntoView({ behavior: "smooth", block: "center" }); const i = b.querySelector("input"); if (i && !i.disabled) i.focus(); } }
      });
      el.addEventListener("submit", async (e) => {
        const f = e.target.closest('[data-soc="form"]');
        if (!f) return;
        e.preventDefault();
        if (!C.user) { C.requireLogin(); return; }
        const input = f.querySelector("input"), { kind, target, info } = el._soc;
        const ok = await addComment(kind, target, input.value, info);
        if (ok) input.value = "";
      });
    }
  }

  // petite ligne de compteurs pour les cartes (liste de voitures)
  function badge(kind, target) {
    const s = carStats(kind, target);
    if (!s.likes && !s.comments && !s.votes) return "";
    return `<div class="card-react" aria-label="${s.likes} j'aime, ${s.comments} commentaires">${s.likes ? `<span>♥ ${s.likes}</span>` : ""}${s.comments ? `<span>💬 ${s.comments}</span>` : ""}${s.votes ? `<span>★ ${f1(s.avg)}</span>` : ""}</div>`;
  }

  // ------------------------------------------------------------ fiche du catalogue
  function relatedOf(car) {
    const ids = new Set(car.related || []);
    FAMILIES.forEach((fam) => { if (fam.includes(car.id)) fam.forEach((x) => ids.add(x)); });
    ids.delete(car.id);
    return Array.from(ids).map((id) => C.carsById.get(id)).filter(Boolean);
  }

  function historyHtml(car) {
    const esc = C.esc;
    const items = [];
    car.phases.forEach((p) => {
      const eds = (p.notableEditions || []).filter(Boolean);
      const engines = (p.engines || []).filter((e) => e && e.power).map((e) => `${esc(e.name)} (${e.power} ch)`).slice(0, 3).join(" · ");
      if (!p.details && !eds.length && !engines) { items.push(`<li><b>${esc(p.phaseName)}</b></li>`); return; }
      items.push(`<li><b>${esc(p.phaseName)}</b>${p.details ? `<span>${esc(p.details)}</span>` : ""}${engines ? `<small class="lap-meta">${engines}</small>` : ""}${eds.length ? `<small class="lap-meta">Éditions : ${eds.map(esc).join(", ")}</small>` : ""}</li>`);
    });
    if (items.length < 2) return "";
    return `<div class="history-box"><div class="sheet-section-head">Versions &amp; générations</div><ol class="timeline">${items.join("")}</ol></div>`;
  }

  function enhanceSheet(car) {
    const root = document.getElementById("vehicle-detail-content");
    if (!root || root.querySelector(".social-zone")) return;
    const esc = C.esc;
    const body = root.querySelector(".sheet-core-body");
    // galerie : vignettes qui pilotent le carrousel
    const hero = root.querySelector(".sheet-hero-banner");
    if (hero && car.images && car.images.length > 1) {
      const strip = document.createElement("div");
      strip.className = "gallery-strip"; strip.setAttribute("role", "group"); strip.setAttribute("aria-label", "Galerie photos");
      strip.innerHTML = car.images.map((u, i) => `<button type="button" class="${i ? "" : "on"}" data-gal="${i}" aria-label="Photo ${i + 1}"><img src="${esc(C.safeUrl(u) || "")}" alt="" loading="lazy" data-fallback="car"></button>`).join("");
      strip.addEventListener("click", (e) => {
        const b = e.target.closest("[data-gal]");
        if (!b) return;
        const sl = hero.querySelector("[data-slides]");
        if (sl) sl.scrollTo({ left: Number(b.dataset.gal) * sl.clientWidth, behavior: "smooth" });
        strip.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      });
      hero.insertAdjacentElement("afterend", strip);
      const sl = hero.querySelector("[data-slides]");
      if (sl) sl.addEventListener("scroll", () => {
        const i = Math.round(sl.scrollLeft / sl.clientWidth);
        strip.querySelectorAll("button").forEach((x, n) => x.classList.toggle("on", n === i));
      }, { passive: true });
    }
    const rel = relatedOf(car);
    const head = root.querySelector(".sheet-heading-box");
    if (head && rel.length) {
      const line = document.createElement("div");
      line.className = "related-line";
      line.innerHTML = `<b>Voir aussi :</b>` + rel.map((r) => `<a class="related-chip" href="#/voiture/${encodeURIComponent(r.id)}">${esc(r.model)}</a>`).join("");
      head.appendChild(line);
    }
    if (body) {
      const hist = document.createElement("div");
      hist.innerHTML = historyHtml(car);
      const first = hist.firstElementChild;
      const recHead = Array.from(body.querySelectorAll(".sheet-section-head")).find((h) => /Photos de la communaut/.test(h.textContent));
      const zone = document.createElement("div");
      zone.className = "social-zone";
      zone.innerHTML = `<div class="sheet-section-head">Avis de la communauté</div><div class="social-mount"></div>`;
      if (recHead) { if (first) recHead.before(first); recHead.before(zone); } else { if (first) body.appendChild(first); body.appendChild(zone); }
      mount(zone.querySelector(".social-mount"), "cat", car.id, { ownerUid: null, title: car.brand + " " + car.model, link: "index.html#/voiture/" + encodeURIComponent(car.id) });
    }
    loadStats();
  }

  // ------------------------------------------------------------ voiture d'un pilote (page dédiée)
  async function renderCommCar(id) {
    const root = document.getElementById("commcar-content");
    const esc = C.esc;
    root.innerHTML = `<div class="empty-note">Chargement…</div>`;
    let car = (window.MAApp.getCommunityCars() || []).find((c) => c.id === id);
    try {
      if (!car) { const d = await C.db.collection("community_cars").doc(id).get(); if (d.exists) car = Object.assign({ id: d.id }, d.data()); }
    } catch (e) { /* géré plus bas */ }
    if (!car) { root.innerHTML = `<div class="empty-note error">Cette voiture n'existe pas (ou plus).</div>`; return; }
    document.title = (car.name || "Voiture") + " | MOTORAUTO";
    const photos = (car.photos || []).filter((u) => C.safeUrl(u));
    const meta = [car.year, car.engine, car.power ? car.power + " ch" : ""].filter(Boolean).map(esc).join(" · ");
    const mods = String(car.mods || "").split("\n").map((x) => x.trim()).filter(Boolean);
    root.innerHTML = `
      <div class="sheet-hero-banner"><div class="car-slides${photos.length > 1 ? "" : " single"}" ${photos.length > 1 ? "data-slides" : ""}>${(photos.length ? photos : [""]).map((u, i) => `<img src="${esc(C.safeUrl(u) || "")}" alt="${esc(car.name || "Voiture")} (${i + 1})" data-fallback="car" draggable="false">`).join("")}</div>
        ${photos.length > 1 ? `<button type="button" class="slide-arrow prev" data-action="slide" data-dir="-1" aria-label="Photo précédente">‹</button><button type="button" class="slide-arrow next" data-action="slide" data-dir="1" aria-label="Photo suivante">›</button>` : ""}</div>
      <div class="sheet-heading-box">
        <div class="sheet-brandline">Voiture de pilote</div>
        <h2 class="sheet-big-title">${esc(car.name || "Voiture")}</h2>
        ${meta ? `<p class="sheet-blurb">${meta}</p>` : ""}
        ${car.description ? `<p class="sheet-blurb">${esc(car.description)}</p>` : ""}
        <button type="button" class="comm-owner" data-action="open-profile" data-uid="${esc(car.uid)}">${C.avatarImg(car.avatar, "pilot-row-avatar")}<span>${esc(car.pilot || "Pilote")}${C.MA.admins.tag(car.uid)}</span></button>
        <div class="sheet-actions"><button type="button" class="cta-btn btn-ghost compact-btn" data-action="copy-link">Copier le lien</button></div>
      </div>
      <div class="sheet-core-body">
        ${mods.length ? `<div class="sheet-section-head">Modifications</div><ul class="mods-list">${mods.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>` : ""}
        <div class="sheet-section-head">Avis de la communauté</div><div class="social-mount"></div>
      </div>`;
    root.querySelector('[data-action="copy-link"]').addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(location.origin + location.pathname + "#/voiture-pilote/" + id); C.toast("Lien copié.", "ok"); } catch (_) { C.toast(location.href); }
    });
    mount(root.querySelector(".social-mount"), "com", id, { ownerUid: car.uid, title: car.name || "Voiture", link: "index.html#/voiture-pilote/" + encodeURIComponent(id) });
    loadStats();
  }

  // ------------------------------------------------------------ classements « les plus aimées »
  let topMode = "likes";
  function topEntries(mode) {
    const out = [];
    if (mode !== "community") C.cars.forEach((c) => out.push({ kind: "cat", id: c.id, name: c.brand + " " + c.model, sub: c.years, href: "#/voiture/" + encodeURIComponent(c.id), s: carStats("cat", c.id) }));
    if (mode === "community" || mode === "likes" || mode === "rating") {
      (window.MAApp.getCommunityCars() || []).forEach((c) => out.push({ kind: "com", id: c.id, name: c.name || "Voiture", sub: "par " + (c.pilot || "Pilote"), href: "#/voiture-pilote/" + encodeURIComponent(c.id), s: carStats("com", c.id) }));
    }
    const key2 = mode === "rating" ? (e) => [e.s.avg, e.s.votes] : (e) => [e.s.likes, e.s.avg];
    return out.filter((e) => (mode === "rating" ? e.s.votes > 0 : e.s.likes > 0 || mode === "community")).sort((a, b) => { const x = key2(a), y = key2(b); return y[0] - x[0] || y[1] - x[1]; });
  }
  function rankRow(e, i) {
    const esc = C.esc;
    const score = topMode === "rating" ? `★ ${f1(e.s.avg)}<small>${e.s.votes} vote${e.s.votes > 1 ? "s" : ""}</small>` : `♥ ${e.s.likes}<small>${e.s.comments} 💬</small>`;
    return `<li><a class="rank-row" href="${e.href}"><span class="rank-pos">${i + 1}</span><span class="rank-main"><b>${esc(e.name)}</b><small>${esc(e.sub)}${e.kind === "com" ? " · voiture de pilote" : ""}</small></span><span class="rank-score">${score}</span></a></li>`;
  }
  async function renderTop() {
    const box = document.getElementById("top-cars-list");
    if (!box) return;
    await Promise.all([loadStats(), window.MAApp.loadCommunityOnce ? window.MAApp.loadCommunityOnce() : null]);
    const list = topEntries(topMode).slice(0, 50);
    box.innerHTML = list.length ? list.map(rankRow).join("") : `<li class="empty-note">Rien pour l'instant : like et note des voitures depuis leur fiche pour lancer le classement.</li>`;
    document.querySelectorAll("[data-top-mode]").forEach((b) => { const on = b.dataset.topMode === topMode; b.classList.toggle("active", on); b.setAttribute("aria-selected", String(on)); });
  }
  async function renderHomeTop() {
    const box = document.getElementById("home-top-cars");
    if (!box) return;
    await loadStats();
    topMode = topMode || "likes";
    const list = topEntries("likes").slice(0, 5), esc = C.esc;
    box.innerHTML = list.length ? list.map((e, i) => `<a class="mini-row" href="${e.href}"><span class="mini-rank">${i + 1}</span><span class="mini-main"><b>${esc(e.name)}</b><small>${esc(e.sub)}</small></span><span class="rank-score">♥ ${e.s.likes}</span></a>`).join("") : `<div class="empty-note small">Aucune voiture likée pour l'instant.</div>`;
  }

  window.MASocial = { carStats, badge, loadStats, mount, relatedOf,
    raw: () => ({ likes, votes, comments, reacts }),
    reactionsOf: (kind, target) => { const m = reacts.get(key(kind, target)); const out = { fire: 0, flag: 0, love: 0 }; if (m) m.forEach((e) => { if (out[e] != null) out[e]++; }); return out; } };

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    document.addEventListener("ma:car-rendered", (e) => enhanceSheet(e.detail.car));
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-top-mode]");
      if (b) { topMode = b.dataset.topMode; renderTop(); }
    });
    ctx.Router.register("commcar", { enter: (p) => renderCommCar(p.id) });
    ctx.Router.register("leaderboard", { enter: (p) => { if (p.tab === "voitures") renderTop(); } });
    ctx.Router.register("home", { enter: () => { renderHomeTop(); } });
    document.addEventListener("ma:social", () => {
      if (ctx.Router.is("leaderboard", { tab: "voitures" })) renderTop();
      if (ctx.Router.is("home")) renderHomeTop();
    });
    document.addEventListener("ma:auth", () => { loaded = false; loadStats(true); });
    loadStats();
  });
})();
