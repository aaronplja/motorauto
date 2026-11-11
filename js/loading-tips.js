/**
 * MOTORAUTO — astuces auto pendant les temps de chargement.
 *  1. Écran d'accueil : si le catalogue met plus de ~0,7 s à arriver, un écran MOTORAUTO affiche une astuce qui change toutes les 3,5 s
 *     (jamais plus de 8 s ; Échap ou un clic pour passer). Rien ne s'affiche si tout est rapide.
 *  2. Squelettes : un chargement qui dure plus de 1,5 s ajoute une astuce sous le squelette.
 * Les spinners restent tels quels : c'est un complément, pas un remplacement.
 */
(function () {
  "use strict";
  const T = (s) => (window.MAI18n && window.MAI18n.t ? window.MAI18n.t(s) : s);
  const TIPS = [
    "Les doublons de cartes peuvent être recyclés en cristaux pour fabriquer ce qui te manque.",
    "Un quiz parfait rapporte plus de points de saison qu'un quiz réussi à moitié.",
    "La puissance d'un moteur se compare en chevaux, mais c'est le couple qui donne la sensation de poussée.",
    "Le 0 à 100 km/h dépend autant de l'adhérence et de la transmission que de la puissance.",
    "Le turbo récupère l'énergie des gaz d'échappement ; le compresseur est lui entraîné par le moteur.",
    "Un moteur Wankel utilise un rotor triangulaire à la place des pistons.",
    "Les 24 Heures du Mans se courent depuis 1923 sur le circuit de la Sarthe.",
    "Le Rallye Monte-Carlo ouvre traditionnellement la saison du championnat du monde des rallyes.",
    "Une transmission intégrale répartit la puissance sur les quatre roues pour mieux passer le couple au sol.",
    "Le nom « GT » vient de « Gran Turismo » : une voiture faite pour avaler les kilomètres vite et confortablement.",
    "Sur circuit, freiner tard n'est pas toujours rapide : c'est la vitesse en sortie de virage qui compte.",
    "Les pneus froids adhèrent moins : quelques tours de chauffe changent tout.",
    "Une carte Légende ne se fabrique pas : elle se gagne.",
    "Ta série de connexions peut être protégée par un gel si tu rates un jour.",
    "Ajoute des cartes à ta wishlist : tu es prévenu quand un pilote la propose à l'échange.",
    "Plus tu améliores une carte, plus elle pèse lourd en bataille.",
    "Le défi quotidien de bataille se joue contre l'IA et offre une récompense fixe.",
    "Chaque saison, tes cadres et titres évoluent : « II », « III »… une fois la version précédente débloquée.",
    "Les fiches voiture contiennent le couple, le 0 à 100, l'histoire et le palmarès quand ils sont connus.",
    "La Mini d'origine, en 1959, a popularisé le moteur transversal à traction.",
    "Les freins en carbone-céramique supportent des températures qui feraient fondre l'acier ordinaire.",
    "Le Nürburgring Nordschleife mesure environ 20,8 km et compte plus de 150 virages.",
    "Une voiture « shooting brake » est un break élégant, pensé pour le plaisir avant le coffre.",
    "Sur la route, la vitesse limitée n'est pas un défi : garde les chronos pour le circuit.",
    "Tu peux comparer deux voitures côte à côte depuis leur fiche.",
    "Un pack thématique ou une carte du jour peuvent se cacher dans la boutique : reviens chaque jour."
  ];
  const root = document.documentElement;
  let order = TIPS.map((t, i) => i).sort(() => Math.random() - .5), pos = 0;
  const next = () => T(TIPS[order[pos++ % order.length]]);

  function css() {
    if (document.getElementById("ltips-css")) return;
    const s = document.createElement("style"); s.id = "ltips-css";
    s.textContent = `#ltips{position:fixed;inset:0;z-index:99990;background:var(--bg-core,#0b0d12);color:var(--color-ink,#fff);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center;opacity:1;transition:opacity .35s}
      #ltips.off{opacity:0;pointer-events:none}#ltips b{font-size:1.25rem;letter-spacing:.14em}
      #ltips .lt-sp{width:34px;height:34px;border-radius:50%;border:3px solid var(--stroke-line,#333);border-top-color:var(--accent,#ef4444);animation:ltSpin .8s linear infinite}
      #ltips p,.lt-tip{max-width:34rem;margin:0;color:var(--color-secondary,#aaa);font-size:.95rem;line-height:1.5;min-height:3em}
      #ltips small{color:var(--color-muted,#888)}.lt-tip{font-size:.82rem;text-align:center;margin:.4rem auto 0;min-height:0}
      @keyframes ltSpin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){#ltips .lt-sp{animation:none}#ltips{transition:none}}`;
    document.head.appendChild(s);
  }
  // 1. écran d'accueil
  let splash = null, tick = 0, shown = 0, done = false;
  function hide() { if (done) return; done = true; clearInterval(tick); if (splash) { splash.classList.add("off"); const s = splash; setTimeout(() => s.remove(), 400); } }
  function show() {
    if (done || splash || !document.body) return;
    css(); shown = Date.now();
    splash = document.createElement("div"); splash.id = "ltips"; splash.setAttribute("role", "status"); splash.setAttribute("aria-live", "polite");
    splash.innerHTML = `<b>MOTORAUTO</b><span class="lt-sp" aria-hidden="true"></span><p>${next()}</p><small>${T("Touche l'écran pour passer")}</small>`;
    document.body.appendChild(splash);
    tick = setInterval(() => { const p = splash.querySelector("p"); if (p) p.textContent = next(); if (Date.now() - shown > 8000) hide(); }, 3500);
    splash.addEventListener("click", hide);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") hide(); }, { once: true });
  }
  const seen = (() => { try { return sessionStorage.getItem("ma_splash") === "1"; } catch (_) { return false; } })();
  if (!seen && !/chat\.html$/.test(location.pathname)) {
    try { sessionStorage.setItem("ma_splash", "1"); } catch (_) { /* facultatif */ }
    setTimeout(() => { if (!window.__maCatalogReady) show(); }, 700);
    const ready = () => { window.__maCatalogReady = true; hide(); };
    window.addEventListener("load", () => setTimeout(() => { if (window.__maCatalogReady || !splash) ready(); }, 1500), { once: true });
  }
  (window.MAModules = window.MAModules || []).push(function (ctx) { if (ctx && ctx.catReady && ctx.catReady.then) ctx.catReady.then(() => { window.__maCatalogReady = true; hide(); }, () => hide()); });

  // 2. astuce sous un squelette qui dure
  const timers = new WeakMap();
  new MutationObserver((ms) => {
    for (const m of ms) for (const n of m.addedNodes) {
      if (n.nodeType !== 1) continue;
      const list = n.matches && n.matches(".skel-wrap") ? [n] : n.querySelectorAll ? Array.from(n.querySelectorAll(".skel-wrap")) : [];
      list.forEach((w) => { if (timers.has(w)) return; timers.set(w, setTimeout(() => { if (w.isConnected && !w.querySelector(".lt-tip")) { css(); const p = document.createElement("p"); p.className = "lt-tip"; p.textContent = "💡 " + next(); w.appendChild(p); } }, 1500)); });
    }
  }).observe(document.body || root, { childList: true, subtree: true });
})();
