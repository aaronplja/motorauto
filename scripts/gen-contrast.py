#!/usr/bin/env python3
"""MOTORAUTO — génère css/ui-contrast.css : pour chaque thème, relève juste ce qu'il faut les couleurs de texte
secondaire/discret (--color-secondary, --color-muted), la couleur de remplissage d'accent (--ui-accent-fill, texte blanc/noir lisible dessus)
et la couleur d'accent utilisable comme TEXTE (--ui-accent-text) pour atteindre un contraste WCAG AA (4.5:1) sur les fonds de la page.
Entrée : scripts/contrast-tokens.json (valeurs calculées des variables de chaque thème). Sortie déterministe.
Usage : python3 scripts/gen-contrast.py scripts/contrast-tokens.json > css/ui-contrast.css"""
import json, re, sys

def parse(s):
    m = re.findall(r'[\d.]+', s); return tuple(float(x) for x in m[:3])
def lum(c):
    f = lambda v: (v/255/12.92) if v/255 <= .03928 else (((v/255)+.055)/1.055) ** 2.4
    r, g, b = map(f, c); return .2126*r + .7152*g + .0722*b
def ratio(a, b):
    la, lb = lum(a), lum(b); return (max(la, lb)+.05)/(min(la, lb)+.05)
def mix(a, b, t):  # t part de b
    return tuple(a[i]*(1-t)+b[i]*t for i in range(3))
def hexa(c): return '#%02x%02x%02x' % tuple(int(round(max(0, min(255, v)))) for v in c)

def lift(fg, toward, bgs, need=4.5):
    """mélange fg vers `toward` par pas de 4 % jusqu'à atteindre `need` sur TOUS les fonds ; renvoie (couleur, changé?)"""
    t = 0.0; c = fg
    while min(ratio(c, b) for b in bgs) < need and t < 1:
        t += .04; c = mix(fg, toward, t)
    return c, t > 0

tok = json.load(open(sys.argv[1]))
out = ['/* GÉNÉRÉ par scripts/gen-contrast.py — ne pas éditer à la main. Relève le contraste (WCAG AA 4.5:1) des textes secondaires et des accents, thème par thème. */']
for th, v in tok.items():
    P = {k: parse(x) for k, x in v.items()}
    ink, core, sur, ele = P['color-ink'], P['bg-core'], P['bg-surface'], P['bg-elevated']
    tint = mix(ele, ink, .13 if lum(core) > .5 else .07)  # fond « pire cas » : carte teintée / tuile enfoncée
    bgs = [core, sur, ele, tint]
    lines = []
    for k in ('color-secondary', 'color-muted'):
        c, ch = lift(P[k], ink, bgs)
        if ch: lines.append(f'--{k}:{hexa(c)}')
    acc, onacc = P['accent'], P['on-accent']
    # remplissage d'accent : s'éloigne de la couleur du texte posé dessus
    away = (0, 0, 0) if lum(onacc) > .5 else (255, 255, 255)
    fill, ch = lift(acc, away, [onacc] and [onacc], 4.5)
    lines.append(f'--ui-accent-fill:{hexa(fill) if ch else "var(--accent)"}')
    # accent utilisé comme texte : vers l'encre
    txt, ch = lift(acc, ink, bgs, 4.5)
    lines.append(f'--ui-accent-text:{hexa(txt) if ch else "var(--accent)"}')
    sel = ':root[data-theme="%s"]' % th
    if th == 'dark': sel = ':root:not([data-theme]),' + sel
    out.append(sel + '{' + ';'.join(lines) + '}')
print('\n'.join(out))
