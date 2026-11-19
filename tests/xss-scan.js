/**
 * MOTORAUTO — garde-fou anti-XSS (TECH-106) : npm test
 * Repère, dans js/*.js, les gabarits HTML (`<…${champ}…>`) où un champ saisi par un utilisateur (pseudo, bio, message, titre…)
 * est inséré SANS passer par esc()/escapeHtml(). La liste des cas déjà examinés est dans tests/xss-baseline.json :
 * le test échoue seulement pour un NOUVEAU cas (ou si un cas de la liste a disparu : on nettoie alors la liste avec --update).
 */
"use strict";
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const FIELDS = /\b(username|userName|pseudo|bio|currentCar|carName|message|msg|comment|description|desc|title|text|pilot|author|authorName|label|reply|caption|place|city|club|clubName|team|note|reason)\b/;
const SAFE = /(esc|escapeHtml|escHtml|safe|enc|encodeURIComponent|Number|parseInt|parseFloat|fmt|fmtNum|toFixed|length|size|count|\.n\b|\.id\b)\s*\(|\.length\b|\?\s*["'`]/;
const files = ["", "admin/", "chat/", "game/", "social/", "catalogue/"].flatMap((d) => fs.readdirSync(path.join(root, "js/" + d)).filter((f) => f.endsWith(".js")).map((f) => d + f)).filter((f) => f.endsWith(".js") && !/\.min\.js$/.test(f) && !/^(data-|i18n)/.test(f) && f !== "emoji-icons.js");
const found = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(root, "js", f), "utf8");
  src.split("\n").forEach((line, i) => {
    if (!/[`]/.test(line) || !/<[a-z][^>]*\$\{|\$\{[^}]*\}[^`]*<\/?[a-z]/i.test(line)) return;
    const re = /\$\{([^}]*)\}/g; let m;
    while ((m = re.exec(line))) {
      const ex = m[1].trim();
      if (!FIELDS.test(ex) || SAFE.test(ex)) continue;
      if (/^[A-Za-z_$][\w$]*\.(title|name|label|text)$/.test(ex) && /(CATEGORIES|STEPS|TIPS|SECTIONS|ITEMS|TABS|RAR|MODES)/i.test(line)) continue;   // données statiques du code
      found.push(f + ":" + ex);
    }
  });
}
const uniq = [...new Set(found)].sort();
const basePath = path.join(__dirname, "xss-baseline.json");
if (process.argv.includes("--update")) { fs.writeFileSync(basePath, JSON.stringify(uniq, null, 1) + "\n"); console.log("baseline mise à jour : " + uniq.length + " cas"); process.exit(0); }
const base = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, "utf8")) : [];
const nouveaux = uniq.filter((x) => !base.includes(x));
if (nouveaux.length) { console.error("ÉCHEC xss : champ utilisateur inséré sans esc() →\n  " + nouveaux.join("\n  ") + "\nÉchappe-le avec esc(...) (ou, si la donnée est sûre, relance : node tests/xss-scan.js --update)"); process.exit(1); }
console.log("  ok - anti-XSS : aucun nouveau champ utilisateur non échappé (" + uniq.length + " cas connus examinés)");
