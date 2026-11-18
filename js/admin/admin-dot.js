/**
 * MOTORAUTO — point rouge « il y a quelque chose à faire dans l'administration » (administrateurs seulement).
 * Compte : propositions de correction en attente, messages signalés, annonces signalées, demandes de fiche.
 * Le point apparaît sur « Moi » (barre du bas et menu du haut), sur la ligne Administration du menu et sur les onglets de l'admin.
 */
(function () {
  "use strict";
  let C = null, timer = 0, count = 0;
  const count1 = (q) => q.get().then((s) => s.size).catch(() => 0);
  async function refresh() {
    if (!C || !C.isAdmin) { set(0); return; }
    const [sg, rp, lr, ct] = await Promise.all([
      count1(C.db.collection("suggestions").where("status", "==", "pending").limit(50)),
      count1(C.db.collection("reports").where("status", "==", "open").limit(50)),
      count1(C.db.collection("listing_reports").where("status", "==", "open").limit(50)),
      C.db.collection("contact_messages").where("type", "==", "vehicle").limit(50).get().then((s) => s.size).catch(() => 0)
    ]);
    set(sg + rp + lr + ct);
  }
  function set(n) {
    count = n; document.body.dataset.adminTodo = String(n);
    document.dispatchEvent(new CustomEvent("ma:admin-todo", { detail: { count: n } }));
  }
  window.MAAdminTodo = { count: () => count, refresh };
  (window.MAModules = window.MAModules || []).push(function (ctx) {
    C = ctx;
    const start = () => { clearInterval(timer); if (!ctx.isAdmin) { set(0); return; } refresh(); timer = setInterval(refresh, 90000); };
    document.addEventListener("ma:auth", () => setTimeout(start, 300));
    document.addEventListener("ma:admin-refresh", refresh);
    document.addEventListener("ma:route", (e) => { if (ctx.isAdmin && e.detail && e.detail.name === "admin") setTimeout(refresh, 1500); });
    start();
  });
})();
