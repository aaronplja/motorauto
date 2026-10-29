"use strict";
const assert = require("assert");
const mail = require("../functions/mail.js");
let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ok - " + name); };
const site = "https://exemple.web.app";

t("bienvenue", () => {
  const m = mail.welcome({ name: "Léa", siteUrl: site });
  assert(m.subject.includes("Léa") && m.html.includes(site) && m.text.includes(site));
});
t("bon retour", () => {
  const m = mail.welcomeBack({ name: "", siteUrl: site });
  assert(m.subject.includes("revoir") && m.text.includes("pilote"));
});
t("notification : échappement HTML + lien absolu", () => {
  const m = mail.notification({ name: "Max", notif: { type: "mention", from: "Zoé", text: "<script>alert(1)</script>", link: "chat.html#c=general" }, siteUrl: site + "/" });
  assert(!m.html.includes("<script>") && m.html.includes("&lt;script&gt;"));
  assert(m.html.includes(site + "/chat.html#c=general"));
  assert(m.subject.startsWith("Zoé t'a mentionné"));
});
t("types de notification", () => {
  ["reply", "dm", "follow", "suggestion", "role", "inconnu"].forEach((type) => {
    const m = mail.notification({ name: "A", notif: { type, from: "B", text: "" }, siteUrl: site });
    assert(m.subject.includes("MOTORAUTO") && m.html.length > 200);
  });
});
console.log("\n" + n + " tests réussis");
