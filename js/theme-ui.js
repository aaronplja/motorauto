/* Bloc « Mon thème » : fond + accent, texte toujours lisible, code à partager. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const T = window.MATheme;
  if (!T || !$("ct-box")) return;
  const cur = T.getCustom();
  $("ct-bg").value = cur.bg; $("ct-accent").value = cur.accent;

  function note(msg) { const n = $("ct-note"); if (n) n.textContent = msg; }
  function preview() {
    const c = { bg: $("ct-bg").value, accent: $("ct-accent").value }, d = T.derive(c.bg, c.accent), p = $("ct-preview");
    if (p) { p.style.background = d.vars["--bg-core"]; p.style.color = d.vars["--color-ink"]; p.style.borderColor = d.vars["--accent"];
      p.querySelector("span").style.color = d.vars["--color-muted"]; const b = p.querySelector("i"); b.style.background = d.vars["--accent"]; b.style.color = d.vars["--on-accent"]; }
    return { c, d };
  }
  let timer = 0;
  function apply() {
    const { c, d } = preview();
    clearTimeout(timer);
    timer = setTimeout(() => {
      T.setCustom(c);
      const fixed = T.contrast(T.hex2rgb(c.accent), T.hex2rgb(c.bg)) < 3.2;
      note(fixed ? "Ton accent était peu visible sur ce fond : je l'ai ajusté pour rester lisible." : "Les textes s'adaptent tout seuls pour rester toujours lisibles.");
    }, 60);
  }
  $("ct-bg").addEventListener("input", apply);
  $("ct-accent").addEventListener("input", apply);
  $("ct-reset").addEventListener("click", () => {
    $("ct-bg").value = T.DEFAULT.bg; $("ct-accent").value = T.DEFAULT.accent; apply(); note("Thème réinitialisé.");
  });
  $("ct-copy").addEventListener("click", async () => {
    const code = T.code({ bg: $("ct-bg").value, accent: $("ct-accent").value });
    try { await navigator.clipboard.writeText(code); note("Code copié : " + code); }
    catch (_) { $("ct-code").value = code; $("ct-code").select(); note("Copie ce code : " + code); }
  });
  $("ct-import").addEventListener("click", () => {
    const c = T.parse($("ct-code").value);
    if (!c) { note("Code invalide. Il ressemble à MA-0F172A-38BDF8."); return; }
    $("ct-bg").value = c.bg; $("ct-accent").value = c.accent; $("ct-code").value = ""; apply(); note("Thème importé.");
  });
  preview();
})();
