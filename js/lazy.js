/**
 * MOTORAUTO — modules chargés à la demande (voir LAZY dans scripts/build.js).
 *   • admin : seulement pour les administrateurs (dès que la connexion les reconnaît, ou en arrivant sur #/admin) ;
 *   • quiz  : l'extension du quiz (Survie, Mes erreurs, Proposer) à l'arrivée sur la page quiz.
 * Pendant le chargement, la page concernée affiche un squelette. En mode développement (sans build), window.MA_LAZY n'existe pas et rien ne change.
 */
(function () {
  "use strict";
  const LZ = window.MA_LAZY;
  if (!LZ) return;
  const jobs = {};
  const SKEL = '<div class="skel-wrap lazy-skel" aria-hidden="true"><span class="skel skel-line w60"></span><span class="skel skel-block"></span><span class="skel skel-line w80"></span><span class="skel skel-block"></span></div>';
  let ctx = null;
  const hostOf = { admin: () => document.querySelector("#admin-panel-modal .stage-shell"), quiz: () => document.getElementById("quizgame-root") };

  function skel(name, on) {
    const host = hostOf[name] && hostOf[name](); if (!host) return;
    const old = host.querySelector(":scope > .lazy-skel");
    if (on && !old && !host.children.length) host.insertAdjacentHTML("beforeend", SKEL);
    else if (on && !old && name === "admin") host.insertAdjacentHTML("beforeend", SKEL);
    else if (!on && old) old.remove();
  }
  /** charge un groupe une seule fois, lance ses modules (comme au démarrage) puis rejoue la page courante s'il le faut */
  function load(name) {
    if (!LZ[name]) return Promise.resolve();
    if (jobs[name]) return jobs[name];
    skel(name, true);
    jobs[name] = new Promise((resolve) => {
      const mods = (window.MAModules = window.MAModules || []), before = mods.length;
      const s = document.createElement("script"); s.src = LZ[name]; s.async = true;
      s.onload = () => {
        skel(name, false);
        const c = ctx || (window.MAApp && window.MAApp.ctx && window.MAApp.ctx());
        mods.slice(before).forEach((fn) => { try { fn(c); } catch (e) { console.error("Module différé :", e); } });
        const r = window.Router && window.Router.current && window.Router.current();
        if (r && ((name === "admin" && (r.name === "admin" || r.name === "pilot")) || (name === "quiz" && r.name === "quizgame"))) window.Router.refresh();
        resolve();
      };
      s.onerror = () => { skel(name, false); delete jobs[name]; resolve(); };
      document.head.appendChild(s);
    });
    return jobs[name];
  }
  window.MALazy = { load };
  (window.MAModules = window.MAModules || []).push(function (c) {
    ctx = c;
    const check = () => {
      const r = window.Router && window.Router.current && window.Router.current();
      if (c.isAdmin) { load("admin"); load("quiz"); }
      else if (r && r.name === "quizgame") load("quiz");
    };
    document.addEventListener("ma:auth", check);
    document.addEventListener("ma:route", (e) => {
      const n = e.detail && e.detail.name;
      if (n === "quizgame") load("quiz");
      else if (n === "admin" && c.isAdmin) load("admin");
    });
    check();
  });
})();
