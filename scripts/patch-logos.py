#!/usr/bin/env python3
"""MOTORAUTO — branche les logos de marques : js/brand-logos.js (affichage, jusqu'ici absent de la page) et js/admin-logos.js (outil admin).
Idempotent. Usage : python3 scripts/patch-logos.py puis node scripts/build.js"""
import re, sys
p = 'index.src.html'
s = open(p, encoding='utf-8').read(); ch = False
anchor = '  <script defer src="js/admin-noimg.js"></script>\n'
if anchor not in s: sys.exit('ancre admin-noimg.js introuvable')
for f in ('js/brand-logos.js', 'js/admin-logos.js'):
    tag = '  <script defer src="%s"></script>\n' % f
    if tag not in s:
        s = s.replace(anchor, anchor + tag, 1) if f == 'js/brand-logos.js' else s.replace('  <script defer src="js/brand-logos.js"></script>\n', '  <script defer src="js/brand-logos.js"></script>\n' + tag, 1); ch = True
if ch: open(p, 'w', encoding='utf-8').write(s); print('modifié : index.src.html (brand-logos.js + admin-logos.js)')
else: print('déjà à jour')
