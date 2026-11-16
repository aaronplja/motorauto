/**
 * MOTORAUTO — mise à jour automatique du site ouvert.
 * Une application installée (ou un onglet resté ouvert) peut tourner des jours avec une ancienne version du code : elle n'est alors
 * plus en phase avec le serveur de jeu. Au retour sur le site, on compare les empreintes des fichiers de la page servie avec celles
 * de la page ouverte ; si elles diffèrent, la page se recharge au premier moment sans risque (retour dans l'appli, changement de page).
 * Jamais pendant une saisie, une partie, une ouverture de pack ou dans le salon. Un seul rechargement par version (pas de boucle).
 */
(function () {
  "use strict";
  const RX = /(?:bundle\d*\.min\.(?:js|css)|lazy-[a-z]+\.min\.js)\?v=[0-9a-f]+/g;
  const sig = (s) => Array.from(new Set(String(s).match(RX) || [])).sort().join("|");
  const mine = sig(document.documentElement.innerHTML);
  if (!mine || !window.fetch) return; // version de développement (fichiers non regroupés) : rien à comparer
  const EVERY = 10 * 60 * 1000;
  let lastCheck = Date.now(), target = "", hiddenAt = 0, running = false;
  const tried = () => { try { return sessionStorage.getItem("ma_upd") || ""; } catch (_) { return "?"; } };
  const typing = () => { const a = document.activeElement; return !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); };
  const playing = () => document.documentElement.classList.contains("on-chat") || !!document.querySelector(".qz-card, .qp-q, .pk3, .tcg-flips, .pm-duel, .bl-live, dialog[open]");
  function apply() {
    if (!target || tried() === target || tried() === "?") return;
    try { sessionStorage.setItem("ma_upd", target); } catch (_) { return; }
    location.reload();
  }
  async function check() {
    if (running || target || Date.now() - lastCheck < EVERY) return;
    running = true; lastCheck = Date.now();
    try {
      const r = await fetch(location.pathname + "?maj=" + Date.now(), { cache: "no-store", credentials: "same-origin" });
      if (r.ok) { const next = sig(await r.text()); if (next && next !== mine) target = next; }
    } catch (_) { /* hors ligne : on réessaiera */ }
    running = false;
  }
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") { hiddenAt = Date.now(); return; }
    const away = hiddenAt ? Date.now() - hiddenAt : 0;
    await check();
    if (target && away >= 60000 && !typing() && !playing()) apply();
  });
  window.addEventListener("hashchange", () => { if (target) { if (!typing()) apply(); } else check(); });
  window.MAUpdate = { check: () => { lastCheck = 0; return check().then(() => target !== ""); }, signature: () => mine };
})();
