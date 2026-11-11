#!/usr/bin/env python3
"""Ajoute css/perf.css (feuille de style de fluidité) à index.src.html, en dernier. Idempotent."""
import re, sys, os
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
p = os.path.join(root, "index.src.html")
s = open(p, encoding="utf8").read()
if 'href="css/perf.css"' in s:
    print("déjà en place : index.src.html"); sys.exit(0)
links = list(re.finditer(r'^[ \t]*<link rel="stylesheet" href="css/[^"?]+\.css">[ \t]*\r?\n', s, re.M))
if not links:
    print("aucune feuille de style trouvée"); sys.exit(1)
m = links[-1]
s = s[:m.end()] + '  <link rel="stylesheet" href="css/perf.css">\n' + s[m.end():]
open(p, "w", encoding="utf8").write(s)
print("modifié : index.src.html (css/perf.css ajouté en dernier)")
