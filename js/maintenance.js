/**
 * MOTORAUTO — mode « travaux ».
 * L'administrateur (bouton dans Administration, ou pastille en bas à gauche) bloque le site aux visiteurs :
 * une page « Site en travaux » (image + message au choix) couvre tout, avec un seul bouton « Connexion administrateur ».
 * Réglage partagé dans Firestore : config/maintenance { on, message, image }.
 * La page de travaux couvre tout l'écran (barres comprises) : les visiteurs ne voient et ne touchent rien du site.
 * Un administrateur connu sur l'appareil ne la voit pas du tout (pas de flash au chargement).
 */
(function () {
  "use strict";
  const KEY = "ma_maint", ADM = "ma_maint_adm";
  const knownAdmin = () => { try { return localStorage.getItem(ADM) === "1"; } catch (e) { return false; } };
  const setAdminHint = (v) => { try { if (v) localStorage.setItem(ADM, "1"); else localStorage.removeItem(ADM); } catch (e) {} };
  let C = null, authDone = false, state = { on: false, message: "", image: "" }, unsub = null;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okUrl = (u) => /^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : "";
  const DEFAULT_MSG = "Le site est en travaux. Nous revenons très vite avec du nouveau.";
  const SVG = `<svg viewBox="0 0 200 160" width="200" height="160" aria-hidden="true"><rect x="20" y="130" width="160" height="12" rx="6" fill="currentColor" opacity=".25"/><path d="M100 18 L150 130 H50 Z" fill="#f5a623"/><path d="M89 62 H111 L116 82 H84 Z M80 98 H120 L124 118 H76 Z" fill="#fff"/><rect x="40" y="130" width="120" height="10" rx="3" fill="#2b2b2b"/></svg>`;

  // style injecté une seule fois
  function css() {
    if (document.getElementById("ma-maint-css")) return;
    const s = document.createElement("style"); s.id = "ma-maint-css";
    s.textContent = `
      body.ma-maint-on{overflow:hidden}
      body.ma-maint-on .modal-layer{z-index:9600!important}
      #ma-maint{position:fixed;inset:0;z-index:9500;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg-core,#fff);color:var(--color-ink);text-align:center;overflow:auto}
      #ma-maint .mm-box{max-width:560px;width:100%;display:flex;flex-direction:column;align-items:center;gap:16px}
      #ma-maint .mm-img{max-width:min(420px,86vw);max-height:42vh;border-radius:16px;object-fit:contain}
      #ma-maint .mm-svg{color:var(--color-ink)}
      #ma-maint h1{margin:0;font-size:clamp(1.6rem,5vw,2.4rem);letter-spacing:.02em}
      #ma-maint p{margin:0;color:var(--color-secondary);line-height:1.55;white-space:pre-line}
      #ma-maint .mm-admin{margin-top:18px;font-size:.9rem;font-weight:700;background:#f5a623!important;color:#111827!important;border:0!important;border-radius:999px;padding:10px 20px;cursor:pointer}
      #ma-maint .mm-note{font-size:.8rem;color:var(--color-muted)}
      #ma-maint-pill{position:fixed;left:12px;bottom:calc(var(--bar-h,64px) + 28px + env(safe-area-inset-bottom,0px));z-index:900;border:1px solid #f5a623;background:#111827;color:#fff;border-radius:999px;padding:7px 13px;font:inherit;font-size:.78rem;font-weight:600;line-height:1.2;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28);max-width:calc(100vw - 24px)}
      #ma-maint-pill:hover{background:#1f2937}
      @media (max-width:720px){#ma-maint-pill{display:none}}
      #ma-maint-btn{background:#111827!important;color:#fff!important;border:1px solid #f5a623!important;font-weight:600}
      #ma-maint-dlg{position:fixed;inset:0;z-index:9700;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.6);color-scheme:light}
      #ma-maint-dlg .mm-card{width:min(460px,100%);max-height:92vh;overflow:auto;background:#fff;color:#111827;border:1px solid #cbd5e1;border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.35)}
      #ma-maint-dlg h3{color:#111827}
      #ma-maint-dlg label{display:flex;flex-direction:column;gap:4px;font-size:.85rem;color:#111827}
      #ma-maint-dlg textarea,#ma-maint-dlg input[type=url]{font:inherit;padding:10px;border-radius:10px;border:1px solid #94a3b8;background:#fff;color:#111827}
      #ma-maint-dlg textarea::placeholder,#ma-maint-dlg input::placeholder{color:#64748b}
      #ma-maint-dlg .mm-note{color:#475569!important}
      #ma-maint-dlg .mm-row{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
      #ma-maint-dlg .mm-row button{border-radius:999px;padding:9px 16px;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;border:1px solid #cbd5e1;background:#f1f5f9!important;color:#111827!important}
      #ma-maint-dlg .mm-row button[type=submit]{background:#1b5f3d!important;color:#fff!important;border-color:#1b5f3d}
      #ma-maint-dlg .mm-sw{flex-direction:row;align-items:center;gap:10px;font-size:1rem}`;
    document.head.appendChild(s);
  }

  function showOverlay() {
    css();
    let el = document.getElementById("ma-maint");
    const img = okUrl(state.image);
    const html = `<div class="mm-box">
      ${img ? `<img class="mm-img" src="${esc(img)}" alt="Site en travaux">` : `<div class="mm-svg">${SVG}</div>`}
      <h1>Site en travaux</h1>
      <p>${esc(state.message || DEFAULT_MSG)}</p>
      <button type="button" class="cta-btn btn-ghost compact-btn mm-admin" id="ma-maint-login">Connexion administrateur</button>
      <div class="mm-note" id="ma-maint-note" hidden>Ce compte n'est pas administrateur.</div>
    </div>`;
    if (!el) { el = document.createElement("div"); el.id = "ma-maint"; el.setAttribute("role", "alert"); document.body.appendChild(el); }
    if (el.dataset.sig !== html) { el.innerHTML = html; el.dataset.sig = html; }
    document.body.classList.add("ma-maint-on");
    const b = document.getElementById("ma-maint-login");
    if (b) b.onclick = () => {
      const m = document.getElementById("auth-modal"), t = document.getElementById("tab-login-btn");
      if (t) t.click();
      if (C && C.openModal && m) C.openModal(m);
    };
  }
  function hideOverlay() {
    const el = document.getElementById("ma-maint"); if (el) el.remove();
    document.body.classList.remove("ma-maint-on");
  }

  function pill() {
    let p = document.getElementById("ma-maint-pill");
    const want = !!(C && C.isAdmin && state.on);
    if (want && !p) { css(); p = document.createElement("button"); p.type = "button"; p.id = "ma-maint-pill"; p.textContent = "🚧 Site en travaux (visiteurs bloqués) · Gérer"; p.onclick = openDialog; document.body.appendChild(p); }
    else if (!want && p) p.remove();
  }

  function apply() {
    try { localStorage.setItem(KEY, JSON.stringify({ on: !!state.on, message: state.message, image: state.image })); } catch (e) {}
    const admin = !!(C && C.isAdmin);
    if (admin) setAdminHint(true); else if (authDone && C && !C.user) setAdminHint(false);
    if (!authDone && state.on) { pill(); syncBtn(); return; } // on attend de savoir si le visiteur est admin (l'écran de travaux en cache reste affiché)
    if (state.on && !admin) {
      showOverlay();
      const n = document.getElementById("ma-maint-note"); if (n) n.hidden = !(C && C.user);
    } else hideOverlay();
    pill(); syncBtn();
  }

  async function save(patch) {
    const next = Object.assign({}, state, patch);
    const data = { on: !!next.on, message: String(next.message || "").slice(0, 400), image: okUrl(next.image).slice(0, 500), by: C.user.uid };
    await C.db.collection("config").doc("maintenance").set(data);
    state = { on: data.on, message: data.message, image: data.image };
    apply();
  }

  function openDialog() {
    if (!C || !C.isAdmin) return;
    css();
    const d = document.createElement("div"); d.id = "ma-maint-dlg";
    d.innerHTML = `<form class="mm-card" novalidate>
      <h3 style="margin:0">🚧 Mode travaux</h3>
      <label class="mm-sw"><input type="checkbox" id="mm-on" ${state.on ? "checked" : ""}> Bloquer le site aux visiteurs</label>
      <label>Message affiché<textarea id="mm-msg" rows="3" maxlength="400" placeholder="${esc(DEFAULT_MSG)}">${esc(state.message)}</textarea></label>
      <label>Image (lien https, facultatif)<input type="url" id="mm-img" placeholder="https://…/travaux.jpg" value="${esc(state.image)}"></label>
      <p class="mm-note" style="margin:0;font-size:.8rem">Toi (administrateur connecté) tu continues de voir le site normalement. Les visiteurs et les comptes non administrateurs voient la page de travaux avec un bouton « Connexion administrateur ».</p>
      <div class="mm-row"><button type="button" data-x>Fermer</button><button type="submit">Enregistrer</button></div>
    </form>`;
    document.body.appendChild(d);
    const close = () => d.remove();
    d.addEventListener("click", (e) => { if (e.target === d || e.target.hasAttribute("data-x")) close(); });
    d.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const img = d.querySelector("#mm-img").value.trim();
      if (img && !okUrl(img)) { C.toast("Le lien de l'image doit commencer par https://", "err"); return; }
      try {
        await save({ on: d.querySelector("#mm-on").checked, message: d.querySelector("#mm-msg").value.trim(), image: img });
        C.toast(state.on ? "Site en travaux : les visiteurs sont bloqués." : "Site rouvert à tous.", "ok");
        close();
      } catch (ex) { C.toast("Enregistrement impossible : " + (ex.message || ex), "err"); }
    });
  }

  // bouton dans la page Administration (sous « Ouvrir l'éditeur visuel »)
  function syncBtn() {
    const host = document.getElementById("open-site-editor");
    let b = document.getElementById("ma-maint-btn");
    if (!host) return;
    if (!(C && C.isAdmin)) { if (b) b.remove(); return; }
    if (!b) { css(); b = document.createElement("button"); b.type = "button"; b.id = "ma-maint-btn"; b.className = "cta-btn btn-ghost"; b.onclick = openDialog; host.insertAdjacentElement("afterend", b); }
    b.textContent = state.on ? "🚧 Mode travaux : ACTIVÉ" : "🚧 Mode travaux";
  }

  // affichage immédiat depuis le dernier état connu (évite d'entrevoir le site avant la lecture Firestore)
  try { const c = JSON.parse(localStorage.getItem(KEY) || "null"); if (c && c.on) { state = { on: true, message: c.message || "", image: c.image || "" }; if (!knownAdmin()) { document.addEventListener("DOMContentLoaded", () => { if (state.on && !(C && C.isAdmin)) showOverlay(); }); if (document.readyState !== "loading" && document.body) showOverlay(); } } } catch (e) {}

  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    if (unsub) unsub();
    unsub = C.db.collection("config").doc("maintenance").onSnapshot((s) => {
      const d = s.exists ? s.data() : {};
      state = { on: !!d.on, message: d.message || "", image: d.image || "" };
      apply();
    }, () => apply());
    Promise.resolve(C.authReady).then(() => { authDone = true; apply(); }, () => { authDone = true; apply(); });
    document.addEventListener("ma:auth", () => { authDone = true; setTimeout(apply, 50); });
    document.addEventListener("ma:route", () => setTimeout(syncBtn, 200));
    apply();
  });
})();
