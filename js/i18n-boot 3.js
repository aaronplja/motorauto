/* MOTORAUTO — choix de la langue, exécuté AVANT le reste de la page (script bloquant, très léger) :
 * langue choisie dans Réglages › Ambiance, sinon détectée (langue du navigateur, puis fuseau horaire = pays), sinon français.
 * Charge le dictionnaire correspondant (js/i18n/xx.js) avant l'affichage pour éviter un flash de français. */
(function () {
  var SUP = ["fr", "en", "es", "de", "it"];
  var TZ = { "Europe/Madrid": "es", "Atlantic/Canary": "es", "Africa/Ceuta": "es", "America/Mexico_City": "es", "America/Bogota": "es", "America/Lima": "es", "America/Santiago": "es", "America/Caracas": "es", "America/Montevideo": "es", "America/La_Paz": "es", "America/Guayaquil": "es", "America/Panama": "es", "America/Costa_Rica": "es", "America/Havana": "es",
    "Europe/Berlin": "de", "Europe/Vienna": "de", "Europe/Zurich": "de", "Europe/Vaduz": "de", "Europe/Busingen": "de",
    "Europe/Rome": "it", "Europe/Vatican": "it", "Europe/San_Marino": "it",
    "Europe/London": "en", "Europe/Dublin": "en", "America/New_York": "en", "America/Chicago": "en", "America/Denver": "en", "America/Los_Angeles": "en", "America/Toronto": "en", "America/Vancouver": "en", "Australia/Sydney": "en", "Australia/Melbourne": "en", "Pacific/Auckland": "en", "Africa/Johannesburg": "en", "Asia/Kolkata": "en", "Asia/Singapore": "en",
    "Europe/Paris": "fr", "Europe/Brussels": "fr", "Europe/Luxembourg": "fr", "Europe/Monaco": "fr", "Africa/Algiers": "fr", "Africa/Tunis": "fr", "Africa/Casablanca": "fr", "Africa/Dakar": "fr", "America/Martinique": "fr", "Indian/Reunion": "fr" };
  function detect() {
    var langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "fr"]);
    for (var i = 0; i < langs.length; i++) { var b = String(langs[i]).toLowerCase().split("-")[0]; if (SUP.indexOf(b) >= 0) return b; }
    try { var tz = Intl.DateTimeFormat().resolvedOptions().timeZone; if (TZ[tz]) return TZ[tz]; if (/^America\/Argentina\//.test(tz)) return "es"; if (/^Australia\//.test(tz)) return "en"; } catch (e) { /* ignoré */ }
    return "fr";
  }
  var pref = "auto"; try { pref = localStorage.getItem("ma_lang") || "auto"; } catch (e) { /* stockage indisponible */ }
  var det = detect(), lang = SUP.indexOf(pref) >= 0 ? pref : det;
  window.__MA_LANG = { lang: lang, pref: SUP.indexOf(pref) >= 0 ? pref : "auto", detected: det };
  document.documentElement.setAttribute("lang", lang);
  if (lang !== "fr") document.write('<script src="js/i18n/' + lang + '.js"><\/script>');
})();
