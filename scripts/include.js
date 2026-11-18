/** Assemble index.src.html : remplace chaque <!--@include pages/xxx.html--> par le contenu du fragment (récursif). */
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
function include(t, depth = 0) {
  return t.replace(/^[ \t]*<!--@include ([^>]+?)-->[ \t]*\r?\n?/gm, (m, f) => {
    if (depth > 5) throw new Error("include trop profond : " + f);
    const p = path.join(root, f);
    if (!fs.existsSync(p)) throw new Error("fragment introuvable : " + f);
    const c = fs.readFileSync(p, "utf8");
    return include(c.endsWith("\n") ? c : c + "\n", depth + 1);
  });
}
const assemble = () => include(fs.readFileSync(path.join(root, "index.src.html"), "utf8"));
module.exports = { include, assemble };
