
import re
p='js/app.js';s=open(p,encoding='utf8').read()
def rep(a,b):
    global s
    assert a in s, "motif introuvable : "+a[:50]
    s=s.replace(a,b,1)
if "noReload" not in s:
    rep("async function quickAddPhoto(carId, url) {\n    if (!isAdmin) return;","async function quickAddPhoto(carId, url, opts) {\n    if (!isAdmin) return false;")
    rep("const car = carsById.get(carId); if (!car) return;\n    const clean = safeUrl(url);\n    if (!clean) { MA.toast(\"L'adresse de l'image doit commencer par https://\", \"err\"); return; }","const car = carsById.get(carId); if (!car) return false;\n    const clean = safeUrl(url);\n    if (!clean) { MA.toast(\"L'adresse de l'image doit commencer par https://\", \"err\"); return false; }")
    rep("MA.toast(\"Cette photo est déjà sur la fiche.\", \"err\"); return; }","MA.toast(\"Cette photo est déjà sur la fiche.\", \"err\"); return false; }")
    rep("      const y = window.scrollY;                       // on reste à la même place dans la page\n      await loadPublicCatalog();","      if (opts && opts.noReload) return true;         // saisie en série (menu « Voitures sans image »)\n      const y = window.scrollY;                       // on reste à la même place dans la page\n      await loadPublicCatalog();")
    rep("      requestAnimationFrame(() => window.scrollTo(0, y));\n    } catch (err) { MA.toast(\"Erreur : \" + err.message, \"err\"); }\n  }\n  function quickPhotoPick","      requestAnimationFrame(() => window.scrollTo(0, y));\n      return true;\n    } catch (err) { MA.toast(\"Erreur : \" + err.message, \"err\"); return false; }\n  }\n  function quickPhotoPick")
    rep("openModal, closeModal, carCard, commCarHtml, normalize\n    }),","openModal, closeModal, carCard, commCarHtml, normalize, quickAddPhoto, isGenericImg, reloadCatalog: () => loadPublicCatalog()\n    }),")
    open(p,'w',encoding='utf8').write(s); print("app.js patché")
else: print("app.js déjà patché")
p='index.src.html';s=open(p,encoding='utf8').read()
if "js/admin-noimg.js" not in s:
    a='  <script defer src="js/maintenance.js"></script>\n'
    assert a in s
    s=s.replace(a,a+'  <script defer src="js/admin-noimg.js"></script>\n',1); open(p,'w',encoding='utf8').write(s); print("balise ajoutée")
