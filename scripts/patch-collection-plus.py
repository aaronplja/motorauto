#!/usr/bin/env python3
# Ajoute le tri par année dans js/cards.js et branche js/collection-plus.js dans index.src.html
import re,sys
def rw(p,f):
    s=open(p,encoding='utf8').read();n=f(s)
    if n!=s: open(p,'w',encoding='utf8').write(n); print('modifié',p)
    else: print('rien à faire',p)
def cards(s):
    if 'yeard:' in s: return s
    a='level: (a, b) => lvOf(b.id) - lvOf(a.id) || byNum(a, b)\n    };'
    assert a in s,'bloc tri introuvable'
    s=s.replace(a,'level: (a, b) => lvOf(b.id) - lvOf(a.id) || byNum(a, b),\n      year: (a, b) => (G.yearOf(a) || 9999) - (G.yearOf(b) || 9999) || byNum(a, b),\n      yeard: (a, b) => (G.yearOf(b) || 0) - (G.yearOf(a) || 0) || byNum(a, b)\n    };',1)
    b='["brand", "Tri : marque"]].map'
    assert b in s,'liste tri introuvable'
    return s.replace(b,'["brand", "Tri : marque"], ["year", "Tri : année (anciennes)"], ["yeard", "Tri : année (récentes)"]].map',1)
def html(s):
    if 'collection-plus.js' in s: return s
    m=re.search(r'[ \t]*<script defer src="js/admin-noimg\.js"></script>\n',s)
    assert m,'admin-noimg introuvable'
    return s[:m.end()]+'  <script defer src="js/collection-plus.js"></script>\n'+s[m.end():]
rw('js/cards.js',cards); rw('index.src.html',html)
