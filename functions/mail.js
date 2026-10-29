"use strict";
// Gabarits des e-mails MOTORAUTO (fonctions pures, testées dans tests/mail.test.js).

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function layout(title, bodyHtml, cta, siteUrl) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#0b0b0d;font-family:Arial,Helvetica,sans-serif;color:#e8e8ec">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0b0d"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#16161a;border:1px solid #2a2a31;border-radius:14px">
<tr><td style="padding:22px 28px 0;font-size:20px;font-weight:800;letter-spacing:.04em"><span style="color:#e8e8ec">MOTOR</span><span style="color:#ff5a1f">AUTO</span></td></tr>
<tr><td style="padding:14px 28px 4px;font-size:20px;font-weight:700">${esc(title)}</td></tr>
<tr><td style="padding:6px 28px 8px;font-size:15px;line-height:1.55;color:#c9c9d1">${bodyHtml}</td></tr>
${cta ? `<tr><td style="padding:10px 28px 22px"><a href="${esc(cta.url)}" style="display:inline-block;background:#ff5a1f;color:#0b0b0d;text-decoration:none;font-weight:800;padding:11px 20px;border-radius:9px">${esc(cta.label)}</a></td></tr>` : ""}
<tr><td style="padding:14px 28px 22px;border-top:1px solid #2a2a31;font-size:12px;color:#8a8a94">Tu reçois ce message car tu as un compte sur <a href="${esc(siteUrl)}" style="color:#ff5a1f">MOTORAUTO</a>. Tu peux désactiver ces e-mails dans <b>Mon garage → Paramètres du profil</b>.</td></tr>
</table></td></tr></table></body></html>`;
}

function welcome({ name, siteUrl }) {
  const n = name || "pilote";
  return {
    subject: `Bienvenue sur MOTORAUTO, ${n} !`,
    text: `Bienvenue sur MOTORAUTO, ${n} !\n\nTon compte est prêt : parcours le catalogue, enregistre tes chronos, ajoute tes voitures et discute avec les autres pilotes dans le salon.\n\n${siteUrl}\n\nTu peux désactiver ces e-mails dans Mon garage > Paramètres du profil.`,
    html: layout(`Bienvenue, ${n} !`, "Ton compte est prêt. Parcours le catalogue, enregistre tes chronos, ajoute tes voitures à ton profil et discute avec les autres pilotes dans le salon.", { url: siteUrl, label: "Ouvrir MOTORAUTO" }, siteUrl)
  };
}

function welcomeBack({ name, siteUrl }) {
  const n = name || "pilote";
  return {
    subject: `Content de te revoir sur MOTORAUTO, ${n}`,
    text: `Content de te revoir, ${n} !\n\nDe nouvelles voitures et de nouveaux chronos t'attendent.\n\n${siteUrl}\n\nTu peux désactiver ces e-mails dans Mon garage > Paramètres du profil.`,
    html: layout(`Content de te revoir, ${n} !`, "De nouvelles voitures et de nouveaux chronos t'attendent depuis ta dernière visite.", { url: siteUrl, label: "Reprendre où j'en étais" }, siteUrl)
  };
}

const TITLES = {
  reply: (f) => `${f} t'a répondu`,
  mention: (f) => `${f} t'a mentionné`,
  dm: (f) => `Nouveau message de ${f}`,
  follow: (f) => `${f} s'est abonné à toi`,
  suggestion: () => "Ta proposition a été traitée",
  role: () => "Ton grade a changé"
};

function absoluteLink(siteUrl, link) {
  const base = String(siteUrl || "").replace(/\/+$/, "");
  if (!link) return base + "/";
  if (/^https?:\/\//i.test(link)) return link;
  return base + "/" + String(link).replace(/^\/+/, "");
}

function notification({ name, notif, siteUrl }) {
  const from = notif.from || "Un pilote";
  const title = (TITLES[notif.type] || (() => "Nouvelle notification"))(from);
  const text = notif.text ? String(notif.text) : "";
  const url = absoluteLink(siteUrl, notif.link);
  return {
    subject: `${title} — MOTORAUTO`,
    text: `Salut ${name || "pilote"},\n\n${title}${text ? " :\n« " + text + " »" : "."}\n\n${url}\n\nTu peux désactiver ces e-mails dans Mon garage > Paramètres du profil.`,
    html: layout(title, `Salut ${esc(name || "pilote")},${text ? `<br><br><span style="display:block;padding:10px 14px;border-left:3px solid #ff5a1f;background:#1d1d22;border-radius:6px;color:#e8e8ec">${esc(text)}</span>` : ""}`, { url, label: "Voir sur MOTORAUTO" }, siteUrl)
  };
}

module.exports = { welcome, welcomeBack, notification, absoluteLink, esc };
