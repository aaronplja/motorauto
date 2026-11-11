#!/usr/bin/env python3
"""Lot 3 : branche les nouveaux fichiers dans index.src.html et ajuste js/cards.js. Idempotent (peut être relancé sans risque)."""
import re, sys
SCRIPTS = ["js/loading-tips.js", "js/theme-preview.js", "js/shop-plus.js", "js/pilot-card.js", "js/quiz-plus.js", "js/profile-extra.js"]   # <- complété au fil des lots
STYLES = ["css/pack-fx.css"]

def rw(path, fn):
    s = open(path, encoding="utf8").read(); n = fn(s)
    if n != s: open(path, "w", encoding="utf8").write(n); print("modifié", path)
    else: print("déjà à jour", path)

def html(s):
    for f in SCRIPTS:
        if f in s: continue
        m = re.search(r'[ \t]*<script defer src="js/collection-plus\.js"></script>\n', s) or re.search(r'[ \t]*<script defer src="js/admin-noimg\.js"></script>\n', s)
        assert m, "point d'ancrage introuvable pour " + f
        s = s[:m.end()] + '  <script defer src="%s"></script>\n' % f + s[m.end():]
    for f in STYLES:
        if f in s: continue
        ms = list(re.finditer(r'[ \t]*<link rel="stylesheet" href="css/[^"?]+\.css">[ \t]*\r?\n', s)); assert ms, "aucune feuille de style"
        e = ms[-1].end(); s = s[:e] + '  <link rel="stylesheet" href="%s">\n' % f + s[e:]
    return s

def cards(s):
    if "G.THEME_PACKS" not in s:
        a = '    const k = (G.COUNTRIES || []).find((x) => x.id === id);\n    return k ? { label: k.label'
        assert a in s, "packTheme introuvable"
        s = s.replace(a, '    const tp = G.THEME_PACKS && G.THEME_PACKS[id]; if (tp) return { label: tp.name, f: "world", style: tp.style };\n' + a, 1)
    if 'theme: "Thèmes"' not in s:
        a = 'category: "Familles" };'
        assert a in s, "kindLabel introuvable"
        s = s.replace(a, 'category: "Familles", theme: "Thèmes" };', 1)
    return s

rw("index.src.html", html); rw("js/cards.js", cards)
