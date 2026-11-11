/**
 * MOTORAUTO — saison d’un mois : pass gratuit de 30 paliers, quêtes enchaînées, gels de série,
 * cadres et titres, carte de bienvenue. Tout le décompte est tenu par le serveur (game.js).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G) return;
  let C = null, freezes = null, busy = false, welcomeShown = false, ssnTab = "pass";
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const API = (n, d) => window.MAGameAPI.call(n, d);
  const doc = () => (window.MACards && window.MACards.mine()) || null;
  const seasonState = () => { const d = doc(), cur = G.seasonInfo().n; return d && d.season && d.season.n === cur ? d.season : G.blankSeason(cur); };
  const root = () => document.getElementById("season-root");

  function frameDemo(id) {
    const f = G.FRAMES[id], av = (C.profile && C.profile.avatar) || "";
    return `<span class="ssn-av cosm-f cf-${id}${f.base ? " cf-" + f.base : ""}" style="--cf:${f.color}">${av ? `<img src="${C.esc(av)}" alt="" data-fallback="avatar">` : "<i></i>"}</span>`;
  }
  function tierHtml(t, sn, tier) {
    const r0 = G.passReward(t), cs = (doc() && doc().cosm) || [], got = sn.claimed.indexOf(t) >= 0, r = Object.assign({}, r0, { frame: r0.frame ? G.shownVariant(cs, "f", r0.frame, got) : "", title: r0.title ? G.shownVariant(cs, "t", r0.title, got) : "" }), can = !got && tier >= t, big = r.frame || r.title || r.bonus || r.freeze || r.epic || r.circuit || r.choice;
    const icons = (r.choice ? "★ " : "") + (r.epic ? "💜 " : "") + (r.circuit ? "🏁 " : "") + (r.bonus ? "🎁 " : "") + (r.freeze ? "❄ " : "") + (r.frame ? "🖼 " : "") + (r.title ? "🎖 " : "") + (r.dust ? "◆ " : "");
    const head = r.choice ? T("Légendaire au choix") : r.epic ? T("Carte Épique") : r.circuit ? T("Carte Circuit") : r.bonus ? (r.bonus > 1 ? r.bonus + " " + T("packs bonus") : T("Pack bonus")) : r.freeze ? T("Gel de série") : r.frame ? T("Cadre") + " " + T(G.FRAMES[r.frame].name) : r.title ? T("Titre") : "+" + r.dust + " " + T("cristaux");
    const more = [r.dust && (r.choice || r.epic || r.bonus || r.freeze || r.frame || r.title) ? "+" + r.dust + " " + T("cristaux") : "", r.choice && r.frame ? T("Cadre") + " " + T(G.FRAMES[r.frame].name) : "", r.epic && r.title ? T("Titre") + " « " + T(G.TITLES[r.title].name) + " »" : "", r.choice && r.title ? T("Titre") + " « " + T(G.TITLES[r.title].name) + " »" : "", !r.choice && !r.epic && r.frame && r.bonus ? T("Cadre") + " " + T(G.FRAMES[r.frame].name) : "", r.title && !r.choice && !r.epic ? "« " + T(G.TITLES[r.title].name) + " »" : ""].filter(Boolean).join(" · ");
    return `<button type="button" class="ssn-tier ${got ? "got" : can ? "can" : "lock"}${big ? " big" : ""}" ${can ? `data-ssn-claim="${t}"` : "disabled"} title="${C.esc(T("Palier") + " " + t + " : " + G.passLabel(r0, cs, got))}">
      <i>${t}</i><span class="ssn-rw"><b>${C.esc(head)}</b>${more ? `<small>${C.esc(more)}</small>` : ""}</span><em>${got ? "✓" : can ? T("Récupérer") : icons.trim() ? "🔒" : "🔒"}</em></button>`;
  }
  function questHtml(sn) {
    const qs = G.questState(sn);
    const rk = sn.rk || 1, qlist = G.questList(rk);
    return `${rk > 1 ? `<p class="ssn-rank">${T("Quêtes de saison")} ${G.romanOf(rk)} — ${T("objectifs et récompenses relevés")}</p>` : ""}<ol class="ssn-quests">${qlist.map((q, i) => {
      const done = i < sn.q, now = i === sn.q && !qs.done, prog = now ? qs.prog : done ? q.goal : 0, pct = Math.round(100 * prog / q.goal);
      return `<li class="${done ? "done" : now ? "now" : "todo"}"><i>${done ? "✓" : i + 1}</i><div><b>${T(q.label)}</b><span class="ssn-bar"><u style="width:${pct}%"></u></span><small>${prog} / ${q.goal} · +${q.dust} ${T("cristaux")}</small></div>
        ${now && qs.ready ? `<button type="button" class="cta-btn fill-btn" data-ssn-quest>${T("Récupérer")}</button>` : ""}</li>`;
    }).join("")}<li class="final ${qs.done ? "done" : ""}"><i>★</i><div><b>${T("Récompense finale exclusive")}</b><small>${T("Cadre « Quête de saison », titre « Briseur de quêtes » et")}${rk > 1 ? " (" + G.romanOf(rk) + ")" : ""} ${G.SEASON_QUEST_FINAL.dust} ${T("cristaux")}</small></div></li></ol>`;
  }
  function cosmHtml() {
    const uid = C.user.uid, d = doc(), mine = window.MACosm ? window.MACosm.get(uid) : {};
    const ok = (k, id) => window.MACosm.unlocked(k, id, uid, d);
    const shown = (k, id) => { const df = (k === "f" ? G.FRAMES : G.TITLES)[id]; return !df.base || ok(k, id) || G.nextVariant((d && d.cosm) || [], k, df.base) === id; };
    const fr = Object.keys(G.FRAMES).filter((id) => shown("f", id)).map((id) => { const u = ok("f", id), on = mine.frame === id;
      return `<button type="button" class="ssn-cos ${u ? "" : "lock"} ${on ? "on" : ""}" data-cos-f="${id}" ${u ? "" : "disabled"} title="${C.esc(u ? G.FRAMES[id].name : T("À débloquer : ") + T(window.MACosm.req("f", id)))}">${frameDemo(id)}<b>${T(G.FRAMES[id].name)}</b><small>${u ? (on ? T("Équipé") : "") : T(window.MACosm.req("f", id))}</small></button>`; }).join("");
    const ti = Object.keys(G.TITLES).filter((id) => shown("t", id)).map((id) => { const u = ok("t", id), on = mine.title === id;
      return `<button type="button" class="ssn-cos ssn-ti ${u ? "" : "lock"} ${on ? "on" : ""}" data-cos-t="${id}" ${u ? "" : "disabled"}><b>${T(G.TITLES[id].name)}</b><small>${u ? (on ? T("Équipé") : "") : T(window.MACosm.req("t", id))}</small></button>`; }).join("");
    return `<div class="ssn-cos-grid">${fr}</div><h4>${T("Titres")}</h4><div class="ssn-cos-grid ti">${ti}</div>
      ${mine.frame || mine.title ? `<button type="button" class="cta-btn btn-ghost" data-cos-clear>${T("Retirer cadre et titre")}</button>` : ""}`;
  }
  /** tableau « comment gagner des points » + compteur du jour (plafond quotidien) */
  function howHtml() {
    const P = G.SEASON_PTS, cap = G.SEASON_DAY_CAP, today = Math.min(cap, G.seasonToday(doc() || {}, Date.now())), pct = Math.round(100 * today / cap);
    const row = (ico, label, pts, free) => `<li><i aria-hidden="true">${ico}</i><span>${T(label)}</span><b>+${pts}${free ? " ★" : ""}</b></li>`;
    return `<div class="ssn-how2"><div class="ssn-day"><div><b>${today} / ${cap}</b><small>${T("points de jeu gagnés aujourd'hui")}</small></div><span class="ssn-bar"><u style="width:${pct}%"></u></span></div>
      <ul>${row("📦", "Ouvrir un pack", P.pack)}${row("❓", "Bonne réponse au quiz", P.quizOk)}${row("🎯", "Quiz parfait", P.quizPerfect)}${row("➕", "Bonne réponse au Plus ou moins", P.pmOk)}${row("⬆️", "Améliorer une carte", P.upgrade)}${row("🔮", "Fusionner des cartes", P.fuse)}${row("🔄", "Réussir un échange", P.trade)}${row("🛠️", "Fabriquer une carte", P.craft)}
      ${row("📅", "Visite du jour", P.visit, 1)}${row("🎯", "Valider un défi de la semaine", P.challenge, 1)}${row("📚", "Compléter un album", P.album, 1)}</ul>
      <small class="ssn-note">★ ${T("hors plafond quotidien")} · ${T("Les quêtes ne sont jamais plafonnées.")}</small></div>`;
  }
  /** choix d'une Légendaire parmi trois (palier 30) */
  function pickLegend(tier, offer) {
    return new Promise((resolve) => {
      const M = window.MACards, ov = document.createElement("div"); ov.className = "ssn-pick";
      ov.innerHTML = `<div class="ssn-pick-box" role="dialog" aria-modal="true" aria-label="${T("Choisis ta Légendaire")}"><h3>★ ${T("Choisis ta Légendaire")}</h3><p>${T("Une seule carte à garder parmi ces trois. Ton choix est définitif.")}</p>
        <div class="ssn-pick-grid">${offer.map((id) => { const c = M.cardObj(id); return c ? `<button type="button" class="ssn-pick-card" data-pick-id="${C.esc(id)}" aria-label="${C.esc((c.brand || "") + " " + (c.model || ""))}"><span>${M.cardHtml(c, { owned: true, count: 0, lv: 1 })}</span></button>` : ""; }).join("")}</div>
        <button type="button" class="cta-btn btn-ghost" data-pick-cancel>${T("Plus tard")}</button></div>`;
      document.body.appendChild(ov); requestAnimationFrame(() => ov.classList.add("on"));
      ov.addEventListener("click", (e) => { const b = e.target.closest("[data-pick-id]"); if (b) { ov.remove(); resolve(b.dataset.pickId); } else if (e.target === ov || e.target.closest("[data-pick-cancel]")) { ov.remove(); resolve(""); } });
    });
  }
  async function draw() {
    const el = root(); if (!el) return;
    if (!C.user) { el.innerHTML = ""; return; }
    if (!window.MACards) return;
    if (!doc()) { await window.MACards.load(); }
    if (freezes === null) { try { const r = await API("touchStreak"); freezes = typeof r.freezes === "number" ? r.freezes : 0; if (r.doc && window.MACards.applyDoc) window.MACards.applyDoc(r.doc); } catch (_) { freezes = 0; } }
    const info = G.seasonInfo(), sn = seasonState(), tier = G.passTier(sn), toNext = tier >= G.PASS_TIERS ? 0 : G.PASS_STEP - (sn.pts % G.PASS_STEP), pct = tier >= G.PASS_TIERS ? 100 : Math.round(100 * (sn.pts % G.PASS_STEP) / G.PASS_STEP);
    const claimable = Array.from({ length: tier }, (_, i) => i + 1).filter((t) => sn.claimed.indexOf(t) < 0).length;
    el.innerHTML = `<section class="ssn" aria-label="${T("Saison")}">
      <header class="ssn-head"><div><small>${T("Saison")} ${info.n}</small><h2>${T("Pass de saison")}</h2><p>${T("Gratuit : joue pour gagner des points de saison et débloquer 30 paliers.")}</p></div>
        <div class="ssn-left"><b>${info.daysLeft}</b><small>${T(info.daysLeft > 1 ? "jours restants" : "jour restant")}</small></div></header>
      <div class="ssn-prog"><div class="ssn-ring" style="--p:${pct}%"><b>${tier}</b><small>/ ${G.PASS_TIERS}</small></div>
        <div><b>${sn.pts} ${T("points de saison")}</b><span class="ssn-bar"><u style="width:${pct}%"></u></span><small>${tier >= G.PASS_TIERS ? T("Pass terminé : bravo !") : `${toNext} ${T("points avant le palier")} ${tier + 1}`}</small>
          ${claimable ? `<button type="button" class="cta-btn fill-btn" data-ssn-all>${T("Tout récupérer")} (${claimable})</button>` : ""}</div></div>
      <div class="ssn-tabs" role="tablist" aria-label="${T("Saison")}">${[["pass", "🏆", "Pass"], ["quests", "🎯", "Défis de saison"], ["cosm", "🖼️", "Cadres et titres"]].map((t) => `<button type="button" role="tab" class="ssn-tab${ssnTab === t[0] ? " on" : ""}" aria-selected="${ssnTab === t[0]}" data-ssn-tab="${t[0]}"><i aria-hidden="true">${t[1]}</i><span>${T(t[2])}</span></button>`).join("")}</div>
      <div class="ssn-pane" data-pane="${ssnTab}">
      ${ssnTab === "quests" ? `      <h3>${T("Défis de saison")}</h3>${questHtml(sn)}` : ssnTab === "cosm" ? `${window.MACosm ? cosmHtml() : ""}` : `
      <div class="ssn-tiers" role="list">${Array.from({ length: G.PASS_TIERS }, (_, i) => tierHtml(i + 1, sn, tier)).join("")}</div>
      ${howHtml(sn)}
      <h3>${T("Gel de série")}</h3>
      <div class="ssn-freeze"><span class="ssn-ice" aria-hidden="true">❄</span><div><b>${freezes || 0} / ${G.FREEZE_MAX} ${T("en stock")}</b><small>${T("Un gel protège ta série de visites : il s'utilise tout seul le premier jour raté. 1 gel offert chaque mois.")}</small></div>
        <button type="button" class="cta-btn btn-ghost${doc() && doc().dust < G.FREEZE_COST && (freezes || 0) < G.FREEZE_MAX ? " lack" : ""}" data-ssn-freeze ${(freezes || 0) >= G.FREEZE_MAX ? "disabled" : ""}>${T("Acheter")} · ${G.FREEZE_COST} ${T("cristaux")}</button></div>`}
      </div>
    </section>`;
  }
  function drawCta() {
    const el = document.getElementById("season-cta"); if (!el) return;
    if (!C || !C.user || !window.MACards || !doc()) { el.innerHTML = ""; return; }
    const sn = seasonState(), tier = G.passTier(sn);
    const pct = tier >= G.PASS_TIERS ? 100 : Math.round(100 * (sn.pts % G.PASS_STEP) / G.PASS_STEP);
    const cl = sn.claimed || []; let ready = 0; for (let i = 1; i <= tier; i++) if (cl.indexOf(i) < 0) ready++;
    el.innerHTML = '<a class="ssn-cta" href="#/pass"><span class="ssn-cta-ic">🏆</span><span class="ssn-cta-tx"><b>' + T("Pass de saison") + '</b><small>' + T("Niveau") + " " + tier + " / " + G.PASS_TIERS + '</small><i class="ssn-cta-bar"><u style="width:' + pct + '%"></u></i></span>' + (ready ? '<em class="ssn-cta-badge">' + ready + "</em>" : '<span class="ssn-cta-go">›</span>') + "</a>";
  }
  const refresh = () => { drawCta(); if (root() && C && C.Router.is("pass")) draw(); };

  async function claim(what, extra) {
    if (busy) return; busy = true;
    try {
      let r = await API("seasonClaim", Object.assign({ what }, extra || {}));
      if (r.need === "pick") {
        if (r.doc) window.MACards.applyDoc(r.doc);
        const pick = await pickLegend(extra && extra.tier, r.offer); if (!pick) { busy = false; draw(); return; }
        r = await API("seasonClaim", Object.assign({ what }, extra || {}, { pick }));
      }
      if (r.doc) window.MACards.applyDoc(r.doc);
      if (r.cards && r.cards.length && window.MACards.cardObj(r.cards[r.cards.length - 1])) { const c = window.MACards.cardObj(r.cards[r.cards.length - 1]); C.toast("🎁 " + r.text + " · " + (c.brand || "") + " " + (c.model || ""), "ok"); }
      else C.toast("🎁 " + r.text, "ok");
    } catch (e) { C.toast(e.message, "err"); }
    busy = false; draw();
  }
  async function claimAll() {
    const sn = seasonState(), tier = G.passTier(sn); if (busy) return; busy = true; let n = 0;
    for (let t = 1; t <= tier; t++) if (sn.claimed.indexOf(t) < 0) { try { const r = await API("seasonClaim", { what: "tier", tier: t }); if (r.doc) window.MACards.applyDoc(r.doc); if (r.need) break; n++; } catch (_) { break; } }
    busy = false; if (n) C.toast(`🎁 ${n} ${T("paliers récupérés")}`, "ok"); draw();
  }
  async function buyFreeze() {
    if (busy) return; busy = true;
    try { const r = await API("buyFreeze"); freezes = typeof r.freezes === "number" ? r.freezes : freezes; if (r.doc) window.MACards.applyDoc(r.doc); C.toast("❄ " + T("Gel de série acheté."), "ok"); }
    catch (e) { C.toast(e.message, "err"); }
    busy = false; draw();
  }
  async function setCos(patch) { try { await window.MACosm.equip(C.user.uid, patch); draw(); } catch (e) { C.toast(e.message, "err"); } }

  // ------------------------------------------------------------------ carte de bienvenue (nouveaux comptes, une seule fois)
  async function maybeWelcome() {
    if (welcomeShown || !C || !C.user || !window.MACards) return;
    const created = C.user.metadata && Date.parse(C.user.metadata.creationTime || "") || 0;
    if (!created || Date.now() - created > 3 * 86400000) return;
    const k = "ma_welcome_" + C.user.uid;
    try { if (localStorage.getItem(k)) return; } catch (_) { /* ignoré */ }
    const d = doc() || await window.MACards.load(); if (!d || d.welcome) return;
    welcomeShown = true;
    const ov = document.createElement("div"); ov.className = "ac-sheet welcome-sheet"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = `<div class="ac-card welcome-card"><button type="button" class="ac-x" data-w-close aria-label="${T("Fermer")}">×</button>
      <h3>${T("Bienvenue chez MOTORAUTO")}</h3><p>${T("Pour bien démarrer, voici un cadeau : 1 pack bonus et")} ${G.WELCOME.dust} ${T("cristaux. Ouvre-le dans Jouer, puis explore à ton rythme.")}</p>
      <div class="welcome-actions"><button type="button" class="cta-btn fill-btn" data-w-claim>${T("Récupérer mon cadeau")}</button><button type="button" class="cta-btn btn-ghost" data-w-close>${T("Plus tard")}</button></div>
      <small>${T("Le tour guidé reste disponible à tout moment avec le bouton (?).")}</small></div>`;
    document.body.appendChild(ov);
    ov.addEventListener("click", async (e) => {
      if (e.target.closest("[data-w-close]") || e.target === ov) { try { localStorage.setItem(k, "1"); } catch (_) { /* ignoré */ } ov.remove(); return; }
      if (e.target.closest("[data-w-claim]")) {
        try { const r = await API("claimWelcome"); window.MACards.applyDoc(r.doc); C.toast("🎁 " + T("Cadeau reçu : ton pack bonus t'attend dans Jouer."), "ok"); try { localStorage.setItem(k, "1"); } catch (_) { /* ignoré */ } ov.remove(); }
        catch (er) { C.toast(er.message, "err"); ov.remove(); }
      }
    });
  }

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = Object.create(ctx);
    ctx.Router.register("pass", { enter: () => { freezes = null; setTimeout(draw, 120); } });
    document.addEventListener("ma:cards", refresh);
    document.addEventListener("ma:route", () => setTimeout(drawCta, 150));
    setTimeout(drawCta, 1500);
    document.addEventListener("ma:auth", () => { freezes = null; welcomeShown = false; setTimeout(maybeWelcome, 2500); refresh(); });
    document.addEventListener("click", (e) => {
      const tb = e.target.closest("[data-ssn-tab]"); if (tb) { ssnTab = tb.dataset.ssnTab; draw(); return; }
      const t = e.target.closest("[data-ssn-claim]"); if (t) return claim("tier", { tier: Number(t.dataset.ssnClaim) });
      if (e.target.closest("[data-ssn-all]")) return claimAll();
      if (e.target.closest("[data-ssn-quest]")) return claim("quest");
      if (e.target.closest("[data-ssn-freeze]")) return buyFreeze();
      const f = e.target.closest("[data-cos-f]"); if (f) return setCos({ frame: f.dataset.cosF });
      const ti = e.target.closest("[data-cos-t]"); if (ti) return setCos({ title: ti.dataset.cosT });
      if (e.target.closest("[data-cos-clear]")) return setCos({ frame: "", title: "" });
    });
    setTimeout(maybeWelcome, 4000);
  });
  window.MASeason = { draw };
})();
