"use strict";
/** Aides communes des tests de régression (ORG-105). */
const fs = require("fs"), path = require("path"), assert = require("assert");
const jsFiles = () => ["", "admin/", "chat/", "game/", "social/", "catalogue/"].flatMap((d) => fs.readdirSync(path.join(__dirname, "../js/" + d)).filter((f) => f.endsWith(".js")).map((f) => d + f));
const read = (f) => (f === "index.src.html" ? require("../scripts/include.js").assemble() : fs.readFileSync(path.join(__dirname, "..", f), "utf8"));
const ok = (label, fn) => { fn(); console.log("  ok - " + label); };
module.exports = { fs, path, assert, jsFiles, read, ok };
