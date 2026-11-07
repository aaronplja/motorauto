/**
 * MOTORAUTO — Affichage commun des batailles de cartes (contre l'IA et contre un joueur).
 * Reçoit un « modèle » décrivant l'état de la partie et dessine l'arène : joueurs, indicateur de tour très visible (bandeau + halo),
 * chrono, cartes (celle de l'adversaire reste cachée tant que la manche n'est pas jouée, puis se retourne), comparaison des caractéristiques,
 * main, choix de la caractéristique, émotes et écran de fin. Les modules de jeu gèrent les clics (data-h, data-stat, data-act, data-em).
 */
(function () {
  "use strict";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };
  const av = (p) => `<i class="bx-av" style="--h:${hue(p.name)}" aria-hidden="true">${esc(String(p.name || "?").trim().charAt(0).toUpperCase())}</i>`;
  const pips = (arr) => `<span class="bx-pips" aria-hidden="true">${arr.map((x) => `<i class="${x}"></i>`).join("")}</span>`;
  const back = `<div class="bt-hidden bx-back">MOTOR<br>AUTO</div>`;
  const bar = (v, o, dir) => { const a = Number(v) || 0, b = Number(o) || 0; if (!a) return 0; const hi = dir > 0 ? Math.max(a, b) : Math.min(a, b); return Math.max(8, Math.round((dir > 0 ? a / hi : hi / a) * 100)); };

  function render(box, m) {
    const prevAk = box.dataset.ak || "", fresh = prevAk !== m.ak; box.dataset.ak = m.ak;
    const turn = m.turn || "", players = ["me", "foe"].map((k) => {
      const p = m[k];
      return `<div class="bx-pl ${k}${turn === k ? " on" : ""}">${av(p)}<span><b>${esc(p.name)}</b>${pips(p.pips || [])}</span><em aria-label="Score">${p.score}</em></div>`;
    });
    const cmp = m.cmp ? `<div class="bx-cmp${fresh ? " anim" : ""}">${m.cmp.map((r) => `<div class="bx-row${r.hot ? " hot" : ""}"><span class="bx-v me ${r.win === "me" ? "w" : ""}">${esc(r.my)} <small>${esc(r.unit)}</small></span><span class="bx-k">${esc(r.label)}<span class="bx-bars"><i class="me ${r.win === "me" ? "w" : ""}" style="--w:${bar(r.my, r.foe, r.dir)}%"></i><i class="foe ${r.win === "foe" ? "w" : ""}" style="--w:${bar(r.foe, r.my, r.dir)}%"></i></span></span><span class="bx-v foe ${r.win === "foe" ? "w" : ""}">${esc(r.foe)} <small>${esc(r.unit)}</small></span></div>`).join("")}</div>` : "";
    const hand = m.hand ? `<div class="bt-hand${m.handOff ? " dim" : ""}">${m.hand.map((h) => `<button type="button" class="pick ${h.used ? "used" : ""} ${h.sel ? "sel" : ""}" data-h="${h.i}" ${m.handOff ? "disabled" : ""} aria-label="${esc(h.label)}">${h.html}</button>`).join("")}</div>` : "";
    const stats = m.stats ? `<div class="bt-stats">${m.stats.map((s) => `<button type="button" class="cta-btn fill-btn" data-stat="${s.k}">${esc(s.label)} · ${esc(s.val || "—")} ${esc(s.unit)}</button>`).join("")}</div>` : "";
    const actions = (m.actions || []).length ? `<div class="tcg-actions">${m.actions.map((a) => `<button type="button" class="cta-btn ${a.primary ? "fill-btn" : "btn-ghost"}" data-act="${esc(a.a)}">${esc(a.label)}</button>`).join("")}</div>` : "";
    const emotes = m.emotes ? `<div class="bx-emotes" role="group" aria-label="Réactions">${m.emotes.list.map(([k, l]) => `<button type="button" data-em="${k}" aria-label="${esc(l)}">${l}</button>`).join("")}</div>` : "";
    const bubble = (side) => m.bubble && m.bubble.side === side ? `<span class="bx-bub ${side}" data-t="${m.bubble.t}">${esc(m.bubble.label)}</span>` : "";
    const timer = m.timer ? `<div class="bx-time${turn === "me" ? " me" : ""}" role="timer" aria-label="Temps restant"><i style="--d:${Math.round(m.timer.dur / 1000)}s;--e:${Math.max(0, (Date.now() - m.timer.start) / 1000).toFixed(1)}s"></i></div>` : "";
    const end = m.end ? `<div class="bx-end ${m.end.cls}${fresh ? " anim" : ""}" role="status"><b>${esc(m.end.title)}</b><span>${esc(m.end.sub)}</span>${m.end.cls === "win" ? `<div class="bx-conf" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>` : ""}${m.end.prize ? `<div class="bx-prize">${m.end.prize}</div>` : ""}</div>` : "";
    box.innerHTML = `<div class="bx" data-turn="${turn}">
      <div class="bx-bar">${players[0]}<div class="bx-mid">${esc(m.mid || "")}</div>${players[1]}</div>
      ${m.banner ? `<div class="bx-banner ${turn}" role="status" aria-live="polite"><b>${esc(m.banner.main)}</b><small>${esc(m.banner.sub || "")}</small></div>` : ""}${timer}
      <div class="bx-arena">
        <div class="bx-slot me${turn === "me" ? " on" : ""}">${m.myCard || back.replace("MOTOR<br>AUTO", "?")}${bubble("me")}</div>
        <span class="bx-vs">VS</span>
        <div class="bx-slot foe${turn === "foe" ? " on" : ""}${m.reveal && fresh ? " flip" : ""}">${m.reveal && m.foeCard ? m.foeCard : back}${bubble("foe")}</div>
      </div>
      ${cmp}${m.verdict ? `<div class="bt-res ${m.verdict.cls}" role="status">${esc(m.verdict.text)}</div>` : ""}${end}
      ${m.hint ? `<p class="tcg-hint">${m.hint}</p>` : ""}${stats}${hand}${actions}${emotes}
      ${m.note ? `<p class="bt-note">${esc(m.note)}</p>` : ""}</div>`;
  }
  window.MABattleUI = { render, esc };
})();
