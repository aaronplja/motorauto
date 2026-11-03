/**
 * MOTORAUTO — saison de 4 semaines : pass gratuit de 30 paliers, quêtes enchaînées, gels de série,
 * cadres et titres, carte de bienvenue. Tout le décompte est tenu par le serveur (game.js).
 */
(function () {
  "use strict";
  const G = window.MAGameCore;
  if (!G) return;
  let C = null, freezes = null, busy = false, welcomeShown = false;
  const T = (s) => (window.MAI18n ? window.MAI18n.t(s) : s);
  const API = (n, d) => window.MAGameAPI.call(n, d);
  const doc = () => (window.MACards && window.MACards.mine()) || null;
  const seasonState = () => { const d = doc(), cur = G.seasonInfo().n; return d && d.season && d.season.n === cur ? d.season : G.blankSeason(cur); };
  const root = () => document.getElementById("season-root");

  function frameDemo(id) {
    const f = G.FRAMES[id], av = (C.profile && C.profile.avatar) || "";
    return `<span class="ssn-av cosm-f cf-${id}" style="--cf:${f.color}">${av ? `<img src="${C.esc(av)}" alt="" data-fallback="avatar">` : "<i></i>"}</span>`;
  }
  function tierHtml(t, sn, tier) {
    const r = G.passReward(t), got = sn.claimed.indexOf(t) >= 0, can = !got && tier >= t, big = r.frame || r.title || r.bonus;
    const label = [r.dust ? `+${r.dust}` : "", r.bonus ? "Pack" : "", r.frame ? "Cadre" : "", r.title ? "Titre" : ""].filter(Boolean).join(" · ");
    return `<button type="button" class="ssn-tier ${got ? "got" : can ? "can" : "lock"}${big ? " big" : ""}" ${can ? `data-ssn-claim="${t}"` : "disabled"} title="${C.esc(T("Palier") + " " + t + " : " + G.passLabel(r))}">
      <i>${t}</i><b>${got ? "✓" : label}</b><small>${r.dust && !r.bonus ? T("cristaux") : ""}</small></button>`;
  }
  function questHtml(sn) {
    const qs = G.questState(sn);
    return `<ol class="ssn-quests">${G.SEASON_QUESTS.map((q, i) => {
      const done = i < sn.q, now = i === sn.q && !qs.done, prog = now ? qs.prog : done ? q.goal : 0, pct = Math.round(100 * prog / q.goal);
      return `<li class="${done ? "done" : now ? "now" : "todo"}"><i>${done ? "✓" : i + 1}</i><div><b>${T(q.label)}</b><span class="ssn-bar"><u style="width:${pct}%"></u></span><small>${prog} / ${q.goal} · +${q.dust} ${T("cristaux")}</small></div>
        ${now && qs.ready ? `<button type="button" class="cta-btn fill-btn" data-ssn-quest>${T("Récupérer")}</button>` : ""}</li>`;
    }).join("")}<li class="final ${qs.done ? "done" : ""}"><i>★</i><div><b>${T("Récompense finale exclusive")}</b><small>${T("Cadre « Quête de saison », titre « Briseur de quêtes » et")} ${G.SEASON_QUEST_FINAL.dust} ${T("cristaux")}</small></div></li></ol>`;
  }
  function cosmHtml() {
    const uid = C.user.uid, d = doc(), mine = window.MACosm ? window.MACosm.get(uid) : {};
    const ok = (k, id) => window.MACosm.unlocked(k, id, uid, d);
    const fr = Object.keys(G.FRAMES).map((id) => { const u = ok("f", id), on = mine.frame === id;
      return `<button type="button" class="ssn-cos ${u ? "" : "lock"} ${on ? "on" : ""}" data-cos-f="${id}" ${u ? "" : "disabled"} title="${C.esc(u ? G.FRAMES[id].name : T("À débloquer : ") + T(window.MACosm.req("f", id)))}">${frameDemo(id)}<b>${T(G.FRAMES[id].name)}</b><small>${u ? (on ? T("Équipé") : "") : T(window.MACosm.req("f", id))}</small></button>`; }).join("");
    const ti = Object.keys(G.TITLES).map((id) => { const u = ok("t", id), on = mine.title === id;
      return `<button type="button" class="ssn-cos ssn-ti ${u ? "" : "lock"} ${on ? "on" : ""}" data-cos-t="${id}" ${u ? "" : "disabled"}><b>${T(G.TITLES[id].name)}</b><small>${u ? (on ? T("Équipé") : "") : T(window.MACosm.req("t", id))}</small></button>`; }).join("");
    return `<div class="ssn-cos-grid">${fr}</div><h4>${T("Titres")}</h4><div class="ssn-cos-grid ti">${ti}</div>
      ${mine.frame || mine.title ? `<button type="button" class="cta-btn btn-ghost" data-cos-clear>${T("Retirer cadre et titre")}</button>` : ""}`;
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
      <div class="ssn-tiers" role="list">${Array.from({ length: G.PASS_TIERS }, (_, i) => tierHtml(i + 1, sn, tier)).join("")}</div>
      <p class="ssn-how">${T("Points : pack ouvert +10 · bonne réponse au quiz +2 (quiz parfait +10) · bonne réponse au Plus ou moins +2 · visite du jour +5")}</p>
      <h3>${T("Quêtes de la saison")}</h3>${questHtml(sn)}
      <h3>${T("Gel de série")}</h3>
      <div class="ssn-freeze"><span class="ssn-ice" aria-hidden="true">❄</span><div><b>${freezes || 0} / ${G.FREEZE_MAX} ${T("en stock")}</b><small>${T("Un gel protège ta série de visites : il s'utilise tout seul le premier jour raté. 1 gel offert chaque mois.")}</small></div>
        <button type="button" class="cta-btn btn-ghost" data-ssn-freeze ${(freezes || 0) >= G.FREEZE_MAX ? "disabled" : ""}>${T("Acheter")} · ${G.FREEZE_COST} ${T("cristaux")}</button></div>
      <h3>${T("Cadres et titres")}</h3>${window.MACosm ? cosmHtml() : ""}
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
      const r = await API("seasonClaim", Object.assign({ what }, extra || {}));
      if (r.doc) window.MACards.applyDoc(r.doc);
      C.toast("🎁 " + r.text, "ok");
    } catch (e) { C.toast(e.message, "err"); }
    busy = false; draw();
  }
  async function claimAll() {
    const sn = seasonState(), tier = G.passTier(sn); if (busy) return; busy = true; let n = 0;
    for (let t = 1; t <= tier; t++) if (sn.claimed.indexOf(t) < 0) { try { const r = await API("seasonClaim", { what: "tier", tier: t }); if (r.doc) window.MACards.applyDoc(r.doc); n++; } catch (_) { break; } }
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
