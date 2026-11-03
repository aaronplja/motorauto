/** Cartes à plusieurs images : node tests/pics.test.js */
"use strict";
const core = require("../js/game-core");
const { createGame } = require("../functions/game");
const { FakeDb } = require("./fake-admin-db");
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; console.log("FAIL:", m); } };
const URLS = ["https://x.fr/1.jpg", "https://x.fr/2.jpg", "https://x.fr/3.jpg", "https://x.fr/4.jpg"];
ok(core.picUrls({ image: URLS[0], images: URLS.concat(["img/local.jpg", URLS[1]]) }).length === 4, "images : https uniquement, sans doublon");
ok(core.picKeys({ image: "img/a.jpg" }).length === 0, "image locale = aucune image réelle");
ok(core.picReward("common", 1, 4, 0).gain === 0 && core.picReward("common", 2, 4, 0).gain === core.RAR.common.dust * 4 && core.picReward("common", 4, 4, 1).gain === core.RAR.common.craft, "paliers 50 % puis 100 %");
ok(core.picReward("common", 2, 4, 3).gain === 0, "palier déjà encaissé");
(async () => {
  let NOW = Date.parse("2026-10-28T10:00:00+01:00"); const db = new FakeDb(() => NOW);
  let seed = 7; const rng = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // catalogue minimal : une seule voiture à 4 images → chaque tirage retombe dessus
  const pool = [{ id: "solo", power: 100, name: "Solo", pics: URLS.map(core.picKey) }];
  const G = createGame({ db, ts: () => db.ts(), rng, now: () => NOW, cardPool: async () => pool, isAdmin: async () => true });
  db.seed("users", "u1", { username: "P1" });
  const U = { uid: "u1" };
  let r = await G.openPack(U, { kind: "test" });
  ok(r.cards.length === 3 && r.cards[0].fresh && r.cards[1].newPic && r.cards[2].newPic, "1re copie = nouvelle, les suivantes débloquent des images");
  ok(r.doc.owned.solo === 1, "pas de doublon quand une image se débloque : " + r.doc.owned.solo);
  ok(r.doc.pics.solo.length === 3 && new Set(r.doc.pics.solo).size === 3, "3 images différentes");
  ok(r.bonus === core.RAR[core.computeRarities(pool).get("solo")].dust * 4, "palier 50 % payé : " + r.bonus);
  r = await G.openPack(U, { kind: "test" });
  ok(r.cards[0].newPic && r.cards[0].picN === 4, "4e image débloquée");
  ok(r.cards[1].fresh === false && !r.cards[1].newPic && r.doc.owned.solo === 3 && r.dust > 0, "collection complète : les copies suivantes sont des doublons");
  ok(r.doc.picClaims.solo === 3, "paliers encaissés une seule fois");
  console.log(fails ? fails + " échec(s)" : "pics.test OK (" + n + " vérifications)"); process.exit(fails ? 1 : 0);
})();
