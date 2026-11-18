/**
 * MOTORAUTO — liste des circuits du monde (noms uniformes pour les chronos) + rapprochement des anciens noms libres.
 *   window.MACircuits = { list: [{name, country, key}], canon(nom) → {name, country, key} | null, canonKey(nom) → clé }
 * Les noms sont en français quand l'usage existe ; « Pays : circuit ; circuit ; … ».
 */
(function (root) {
  "use strict";
  const RAW = `France: Le Mans – Circuit Bugatti ; Le Mans – 24 Heures (circuit complet) ; Magny-Cours – Grand Prix ; Magny-Cours – Club ; Paul Ricard – 1A ; Paul Ricard – 3A ; Paul Ricard – 5A ; Nevers Magny-Cours – Club ; Dijon-Prenois ; Albi – Circuit des Écuyers ; Nogaro – Circuit Paul Armagnac ; Lédenon ; Pau-Arnos ; Pau-Arnos – Circuit de Pau-Arnos ; Pau – Circuit urbain ; Val de Vienne ; Charade – Circuit de Clermont-Ferrand ; Bresse ; Croix-en-Ternois ; Folembray ; Mayenne ; Carole – Circuit Carole ; Montlhéry – Autodrome ; Linas-Montlhéry – Anneau de vitesse ; Rouen-les-Essarts ; Reims-Gueux ; Spa-Francorchamps – Courses d'Ardennes ; Haute-Saintonge ; Circuit du Var – Le Luc ; Circuit de Lohéac ; Circuit de Bourbonnais ; Circuit de l'Anjou – Le Mans Anjou ; Circuit de Nantes-Carquefou ; Circuit de la Ferté-Gaucher ; Circuit d'Ostricourt ; Circuit des Ardennes – Charleville ; Circuit de Mornay ; Circuit de Saint-Ouen ; Circuit de Chambley ; Circuit d'Issoire ; Circuit de Mirecourt ; Circuit de Saint-Christophe ; Circuit de Fontenay-le-Comte ; Circuit de la Châtre ; Circuit de Cognac ; Circuit de Valence – Saint-Jean ; Circuit Pierre Bretagne – Les Ormes ; Circuit de Rouen ; Circuit de Monaco ; Circuit de Cassis ; Circuit de Vaison ;
Allemagne: Nürburgring – Nordschleife ; Nürburgring – Grand Prix ; Nürburgring – Combiné (24h) ; Hockenheimring – Grand Prix ; Hockenheimring – Kurz ; Sachsenring ; Lausitzring ; Norisring ; Hockenheim – Motodrom ; Oschersleben – Motorsport Arena ; Schleiz ; Assen-Zuid ; Motorsport Arena Oschersleben – Kurz ; Bilster Berg ; Grenzlandring ;
Belgique: Spa-Francorchamps ; Zolder ; Zolder – Terlaemen ; Nivelles-Baulers ; Mettet ; Chimay ;
Pays-Bas: Zandvoort ; Assen – TT Circuit ; Lelystad ; Circuit Park Zandvoort – Club ;
Italie: Monza – Autodromo Nazionale ; Monza – Junior ; Imola – Enzo e Dino Ferrari ; Mugello ; Misano – Marco Simoncelli ; Vallelunga – Piero Taruffi ; Franciacorta ; Adria ; Varano – Riccardo Paletti ; Pergusa ; Magione ; Cremona ; Tazio Nuvolari – Cervesina ; Autodromo di Pergusa ; Targa Florio – Piccolo Madonie ; Sestriere ; Autodromo del Levante ; Maranello – Fiorano ; Pista di Balocco ; Autodromo di Modena ; Autodromo Riccardo Paletti – Varano ;
Espagne: Barcelona-Catalunya ; Barcelona-Catalunya – Club ; Valencia – Ricardo Tormo ; Jerez – Ángel Nieto ; Jarama ; Navarra – Los Arcos ; Motorland Aragón ; Albacete ; Calafat ; Almería ; Alcañiz – MotorLand ; Estoril – Autódromo ; Circuito de Cartagena ; Circuito de Guadix ; Circuito de Montmeló – Club ; Circuito de Ascari ; Circuito de Ascari – Ronda ; Circuito del Jarama – Madrid ; Circuito de Los Arcos ; Circuito de Mallorca – Porreres ;
Portugal: Estoril ; Portimão – Autódromo do Algarve ; Braga – Circuito Vasco Sameiro ; Vila Real ; Boavista – Porto ; Montalegre ;
Royaume-Uni: Silverstone – Grand Prix ; Silverstone – National ; Silverstone – International ; Brands Hatch – Grand Prix ; Brands Hatch – Indy ; Donington Park – Grand Prix ; Donington Park – National ; Oulton Park – International ; Oulton Park – Island ; Snetterton – 300 ; Snetterton – 200 ; Thruxton ; Cadwell Park ; Castle Combe ; Goodwood Motor Circuit ; Goodwood – Festival of Speed (montée) ; Knockhill ; Croft ; Rockingham ; Mallory Park ; Anglesey – International ; Anglesey – Coastal ; Pembrey ; Lydden Hill ; Bedford Autodrome ; Silverstone – Stowe ; Aintree ; Zandvoort – Club ; Prescott Hill Climb ; Shelsley Walsh ; Curborough ; Santa Pod ;
Irlande: Mondello Park ; Kirkistown ; Bishopscourt ; Phoenix Park ;
Suisse: Hockenheim – Club (voir Allemagne) ; Lignières ; Bremgarten – Berne ; Course de côte Ayent-Anzère ; Course de côte Hemberg ; Course de côte Oberhallau ;
Autriche: Red Bull Ring – Spielberg ; Salzburgring ; Wachauring Melk ; Pannoniaring ; December – Teesdorf ; Rechbergrennen ; Gaisberg ; Österreichring – ancien ;
République tchèque: Autodrom Most ; Brno – Masaryk ; Brno – Masaryk Moto ; Sosnová ; Czech Autodrom – Hořice ;
Slovaquie: Slovakia Ring ;
Hongrie: Hungaroring ; Pannonia Ring ; Euroring – Balatonring ;
Pologne: Tor Poznań ; Tor Kielce ; Tor Silesia Ring ; Autodrom Słomczyn ;
Roumanie: Sibiu – Circuito Sibiu ; Transfăgărășan (course de côte) ; Autodromul Vidra ;
Bulgarie: Serres – Circuit de Serres ; Rousse – Circuit ;
Grèce: Serres Racing Circuit ;
Turquie: Istanbul Park ; Körfez ;
Croatie: Grobnik – Automotodrom Grobnik ;
Slovénie: Raceland Krško ; Vransko ;
Serbie: Belgrade – Circuit de Belgrade ;
Finlande: Ahvenisto ; Kemora ; Alastaro ; Botniaring ;
Suède: Anderstorp – Scandinavian Raceway ; Karlskoga – Gelleråsen ; Mantorp Park ; Falkenberg – Falkenbergs Motorbana ; Ring Knutstorp ; Kinnekulle ; Sturup – Ring ;
Norvège: Rudskogen ; Arctic Circle Raceway ; Gatebil – Rudskogen ; Haugesund ;
Danemark: Jyllands-Ringen ; Padborg Park ; Roskilde Ring ; Ring Djursland ;
Islande: Kvartmíluklúbburinn – Kapelluhraun ;
Estonie: Pärnu – Rally ; Auto24Ring ;
Lettonie: Biķernieki ; Bikernieki Complex ;
Lituanie: Nemuno Žiedas ; Aukštaitija ;
Russie: Moscow Raceway ; Igora Drive ; Sochi Autodrom ; Kazan – Ring ; Nijni-Novgorod – Ring ;
Ukraine: Chaika – Kiev ;
Biélorussie: Minsk – Autodrome ;
Israël: Eilat – Circuit ;
Émirats arabes unis: Yas Marina ; Dubai Autodrome – Grand Prix ; Dubai Autodrome – Club ; Ras Al Khaimah ;
Bahreïn: Bahrain International – Grand Prix ; Bahrain International – Outer ;
Qatar: Losail International ;
Arabie saoudite: Jeddah Corniche ; Riyad – Circuit ;
Koweït: Kuwait Motor Town ;
Oman: Oman – Circuit ;
Jordanie: Amman – Circuit ;
Maroc: Marrakech – Circuit Moulay El Hassan ; Casablanca – Circuit ; Aïn Diab – Casablanca ; Circuit International Automobile Moulay El Hassan ;
Algérie: Alger – Circuit ;
Tunisie: Tunisie – Circuit de Carthage ;
Égypte: Le Caire – Circuit ;
Afrique du Sud: Kyalami – Grand Prix ; Killarney – Le Cap ; Zwartkops ; East London – Circuit Prince George ; Phakisa ;
Kenya: Kenya – Circuit Sagana ;
Brésil: Interlagos – Autódromo José Carlos Pace ; Jacarepaguá – Nelson Piquet ; Curitiba – Autódromo Internacional ; Brasília – Autódromo Nelson Piquet ; Goiânia ; Velopark ; Cascavel ; Londrina ; Santa Cruz do Sul ;
Argentine: Buenos Aires – Autódromo Oscar y Juan Gálvez ; Termas de Río Hondo ; Rafaela ; Bahia Blanca ; Autódromo de Rosario ;
Chili: Autódromo de Codegua ; Santiago – Autódromo ;
Uruguay: Autódromo Victor Borrat Fabini ;
Colombie: Autódromo de Tocancipá ;
Pérou: Autódromo La Chutana ;
Mexique: Mexico – Autódromo Hermanos Rodríguez ; Puebla – Autódromo Miguel E. Abed ; Monterrey – Autódromo ;
Canada: Gilles Villeneuve – Montréal ; Mosport – Canadian Tire Motorsport Park ; Circuit Mont-Tremblant ; Circuit Trois-Rivières ; Calabogie Motorsports Park ; Shannonville ; Edmonton – Circuit ; Mission – Circuit ;
États-Unis: Indianapolis – Grand Prix ; Indianapolis Motor Speedway ; Daytona – Road Course ; Daytona International Speedway ; Sebring International ; Watkins Glen – Grand Prix ; Road America – Elkhart Lake ; Laguna Seca ; Circuit of the Americas – Austin ; Sonoma Raceway ; Mid-Ohio ; Lime Rock Park ; Virginia International Raceway – Full ; Road Atlanta ; Barber Motorsports Park ; Summit Point ; Pittsburgh International Race Complex ; Thunderhill Raceway – 5 miles ; Buttonwillow Raceway ; Willow Springs – Big Willow ; Streets of Long Beach ; Utah Motorsports Campus ; Pikes Peak (course de côte) ; Circuit of the Americas – West ; Nashville Superspeedway ; Talladega ; Texas World Speedway ; Las Vegas Motor Speedway – Road ; Palm Beach International ; Homestead-Miami – Road ; Miami International Autodrome ; Atlanta Motor Speedway ; New Jersey Motorsports Park – Thunderbolt ; NCM Motorsports Park ; Road America – Kohler ; Brainerd International Raceway ; Blackhawk Farms ; Gingerman Raceway ; Autobahn Country Club ; Palmer Motorsports Park ; Daytona – Flat 3.56 ; Watkins Glen – Boot ; Lime Rock – Club ; Pocono ; Dover ; Indianapolis – Road Course ; Sebring – Club ;
Japon: Suzuka – Circuit complet ; Suzuka – East ; Fuji Speedway ; Motegi – Twin Ring ; Motegi – Road Course ; Okayama – International ; Autopolis ; Sugo – Sportsland ; Tsukuba – Circuit 2000 ; Tsukuba – Circuit 1000 ; Ebisu – Circuit ; Mine – Circuit ; Fuji – Short ; Honda – Twin Ring ; Tokachi Speedway ; Hiroshima – Circuit ; Nagoya – Circuit ; Nishinihon Circuit ; Mobara – Twin Circuit ; Meihan ; Bihoku – Highland ; Aida – Okayama International ;
Corée du Sud: Korea International – Yeongam ; Inje Speedium ; Everland Speedway ;
Chine: Shanghai International ; Zhuhai International ; Zhejiang Circuit ; Ningbo International ; Chengdu – Circuit ; Beijing – Circuit ; Guangdong International ;
Taïwan: Taiwan – Circuit ;
Hong Kong: Hong Kong – Circuit ;
Singapour: Marina Bay – Circuit urbain ;
Malaisie: Sepang International – Grand Prix ; Sepang – Club ; Johor – Circuit ;
Indonésie: Sentul International ; Mandalika ;
Thaïlande: Chang International – Buriram ; Bira Circuit ;
Philippines: Batangas – Circuit ; Clark – Circuit ;
Vietnam: Hanoï – Circuit urbain ;
Inde: Buddh International ; Madras – Circuit ; Kari Motor Speedway ;
Pakistan: Karachi – Circuit ;
Azerbaïdjan: Bakou – Circuit urbain ;
Kazakhstan: Sokol International ;
Australie: Bathurst – Mount Panorama ; Phillip Island – Grand Prix ; Albert Park – Melbourne ; Sandown ; Winton ; Queensland Raceway ; Eastern Creek – Sydney Motorsport Park ; Symmons Plains ; Hidden Valley – Darwin ; Mallala ; Wakefield Park ; The Bend – Motorsport Park ; Lakeside ; Morgan Park ; Mount Gambier ; Barbagallo – Perth ; Calder Park ; Adelaide – Circuit urbain ; Hampton Downs – Auckland ;
Nouvelle-Zélande: Hampton Downs ; Pukekohe ; Taupo – Motorsport Park ; Ruapuna ; Highlands Motorsport Park ; Manfeild ; Teretonga ;
Pacifique: Nouméa – Circuit ; Tahiti – Circuit ;
Mondial – épreuves et événements: 24 Heures de Daytona ; 24 Heures de Spa ; 12 Heures de Sebring ; 24 Heures du Nürburgring ; 1000 km de Bathurst ; Pikes Peak International Hill Climb ; Goodwood – Hillclimb ; Isle of Man TT – Mountain Course ; Pontevedra – Montée ; Targa Florio ; Mille Miglia – Parcours ;
Karting: Karting – Circuit couvert ; Karting – Piste extérieure ; Kart – Carole ; Kart – Le Mans ; Kart – Genk ; Kart – Lonato ; Kart – Mariembourg ; Kart – Wackersdorf ; Kart – Essay ; Kart – Salbris`;

  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const seen = new Set(), list = [];
  RAW.split(/\n/).forEach((line) => {
    const i = line.indexOf(":"); if (i < 0) return;
    const country = line.slice(0, i).trim();
    line.slice(i + 1).replace(/;\s*$/, "").split(";").map((x) => x.trim()).filter(Boolean).forEach((name) => {
      if (/\(voir /i.test(name)) return;                              // doublons de renvoi
      name = name.slice(0, 60); const key = norm(name);
      if (!key || seen.has(key)) return; seen.add(key); list.push({ name, country, key });
    });
  });
  const byKey = new Map(list.map((c) => [c.key, c]));
  const STOP = new Set(["circuit", "de", "du", "des", "la", "le", "les", "autodromo", "autodrome", "international", "grand", "prix", "gp"]);
  const toks = (k) => k.split(" ").filter((t) => t && !STOP.has(t));
  const index = list.map((c) => ({ c, t: toks(c.key) }));
  const cache = new Map();
  /** rapproche un nom libre d'un circuit de la liste : clé identique, sinon tous les mots significatifs d'un côté présents de l'autre */
  function canon(name) {
    const k = norm(name); if (!k) return null;
    if (byKey.has(k)) return byKey.get(k);
    if (cache.has(k)) return cache.get(k);
    const t = toks(k); let best = null, bestScore = 0;
    if (t.length) index.forEach(({ c, t: ct }) => {
      if (!ct.length) return;
      const inter = t.filter((x) => ct.includes(x)).length;
      const full = inter === t.length || inter === ct.length;          // un nom contient l'autre
      const score = inter / Math.max(t.length, ct.length);
      if (full && inter >= (t.length === 1 || ct.length === 1 ? 1 : 2) && score > bestScore) { best = c; bestScore = score; }
    });
    // un seul mot (ex. « monza ») : on n'accepte que s'il désigne un seul circuit
    if (best && t.length === 1) { const same = index.filter(({ t: ct }) => ct.includes(t[0])).length; if (same > 1) best = byKey.get(k) || null; }
    cache.set(k, best); return best;
  }
  const canonKey = (name) => { const c = canon(name); return c ? c.key : norm(name); };
  const api = { list, canon, canonKey, norm, count: list.length };
  if (typeof module === "object" && module.exports) module.exports = api; else root.MACircuits = api;
})(typeof self !== "undefined" ? self : this);
