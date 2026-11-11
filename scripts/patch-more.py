#!/usr/bin/env python3
"""Ajoute css/ui-contrast.css + css/ui-kit.css (en dernier) et js/more-menu.js (après shop-plus.js) à index.src.html. Idempotent."""
import re, os, sys
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
p = os.path.join(root, "index.src.html")
s = open(p, encoding="utf8").read(); ch = False
if 'href="css/ui-kit.css"' not in s:
    ls = list(re.finditer(r'^[ \t]*<link rel="stylesheet" href="css/[^"?]+\.css">[ \t]*\r?\n', s, re.M))
    m = ls[-1]; s = s[:m.end()] + '  <link rel="stylesheet" href="css/ui-kit.css">\n' + s[m.end():]; ch = True
if 'href="css/ui-contrast.css"' not in s:
    k = '  <link rel="stylesheet" href="css/ui-kit.css">\n'
    s = s.replace(k, '  <link rel="stylesheet" href="css/ui-contrast.css">\n' + k, 1); ch = True
if 'src="js/more-menu.js"' not in s:
    m = re.search(r'^[ \t]*<script defer src="js/shop-plus\.js"></script>[ \t]*\r?\n', s, re.M)
    if not m: print("shop-plus.js introuvable : lance d'abord patch-order.py"); sys.exit(1)
    s = s[:m.end()] + '  <script defer src="js/more-menu.js"></script>\n' + s[m.end():]; ch = True
if ch: open(p, "w", encoding="utf8").write(s); print("modifié : index.src.html (ui-kit.css + more-menu.js)")
else: print("déjà en place")
