#!/usr/bin/env python3
"""Corrige l'ordre de chargement : quiz-plus, pilot-card et shop-plus lisent MAGameCore au démarrage,
donc ils doivent venir APRÈS js/game-core.js dans index.src.html. Idempotent."""
import re, os, sys
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
p = os.path.join(root, "index.src.html")
s = open(p, encoding="utf8").read()
mods = ["quiz-plus", "pilot-card", "shop-plus"]
core = re.search(r'^[ \t]*<script defer src="js/game-core\.js"></script>[ \t]*\r?\n', s, re.M)
if not core:
    print("game-core.js introuvable dans index.src.html"); sys.exit(1)
def pos(name):
    m = re.search(r'^[ \t]*<script defer src="js/%s\.js"></script>[ \t]*\r?\n' % re.escape(name), s, re.M)
    return m.start() if m else -1
if all(pos(m) > core.start() for m in mods):
    print("déjà dans le bon ordre"); sys.exit(0)
for m in mods:
    s = re.sub(r'^[ \t]*<script defer src="js/%s\.js"></script>[ \t]*\r?\n' % re.escape(m), "", s, flags=re.M)
core = re.search(r'^[ \t]*<script defer src="js/game-api\.js"></script>[ \t]*\r?\n', s, re.M) or re.search(r'^[ \t]*<script defer src="js/game-core\.js"></script>[ \t]*\r?\n', s, re.M)
ins = "".join('  <script defer src="js/%s.js"></script>\n' % m for m in mods)
s = s[:core.end()] + ins + s[core.end():]
open(p, "w", encoding="utf8").write(s)
print("modifié : index.src.html (quiz-plus, pilot-card, shop-plus après game-api.js)")
