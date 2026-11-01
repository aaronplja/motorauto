/**
 * MOTORAUTO — transmission, fiabilité circuit et verdict « caisse de piste » pour chaque fiche.
 * Chargé après les fichiers de données. Ajoute à chaque voiture :
 *   drives : ["P","T","A","E","X","M","R"]   (Propulsion, Traction, 4x4 permanent, 4x4 enclenchable, Transaxle, Moteur central, Moteur arrière)
 *   track  : { heat, brakes, trans (1 à 5), verdict: "ideal"|"correct"|"watch"|"avoid"|"race", note }
 * Évaluation INDICATIVE de l'équipe (usage intensif en sessions enchaînées) : elle ne remplace pas l'avis d'un professionnel.
 * Format d'une ligne :  id | transmissions | chauffe,freins,transmission | verdict (I C S D R) | conseil
 */
(function (root) {
  "use strict";
  const DRIVES = {
    P: ["Propulsion", "Moteur avant, roues arrière motrices"],
    T: ["Traction", "Moteur avant, roues avant motrices"],
    A: ["4x4 permanent", "Quatre roues motrices en permanence"],
    E: ["4x4 enclenchable", "Passe en 4x4 selon l'adhérence ou le choix du pilote"],
    X: ["Propulsion transaxle", "Boîte placée à l'arrière pour équilibrer les masses"],
    M: ["Moteur central", "Moteur derrière les sièges, roues arrière motrices"],
    R: ["Moteur arrière", "Moteur en porte-à-faux arrière, roues arrière motrices"]
  };
  const VERDICTS = {
    ideal: ["Idéale", "Très bon choix pour débuter ou rouler souvent en piste"],
    correct: ["Correcte", "Convient à la piste avec un entretien et quelques renforts"],
    watch: ["À surveiller", "Possible, mais des points faibles demandent budget et vigilance"],
    avoid: ["Déconseillée", "À éviter pour un usage intensif en circuit"],
    race: ["Voiture de course", "Conçue pour la compétition, non concernée par ces conseils d'achat"]
  };
  const V = { I: "ideal", C: "correct", S: "watch", D: "avoid", R: "race" };
  const RACE = "Conçue pour la piste : aucune évaluation d'achat.";

  const RAW = `
peugeot-206-berline|T|3,3,4|S|Versions essence modestes : plaisantes mais freins et suspensions d'origine vite dépassés sur circuit.
peugeot-206-s16-gt|T|3,3,4|C|2.0 16V solide ; pense aux freins, aux silentblocs et au liquide de refroidissement avant de rouler fort.
peugeot-206-rc|T|2,2,2|D|Boîte BE4 fragile, freins et embrayage sous-dimensionnés : à réserver à un usage modéré ou à renforcer lourdement.
peugeot-206-cc|T|3,3,3|D|Caisse affaiblie par le toit rétractable : peu adaptée à la piste.
peugeot-206-sw|T|3,3,4|D|Break trop lourd et haut pour un usage circuit sérieux.
peugeot-206-plus|T|3,3,4|S|Petit moteur sans réserve de puissance : on use les freins sans gagner de plaisir.
peugeot-206-wrc|A|5,5,5|R|${RACE}
peugeot-206-sedan|T|3,3,4|D|Berline tricorps lourde, sans intérêt particulier en piste.
peugeot-205-berline|T|3,3,4|S|Légère et agile mais ancienne : état de la caisse à vérifier avant tout.
peugeot-205-gti|T|3,3,4|I|Référence de la caisse de piste abordable : légère, mécanique simple. Attention à la rouille et aux trains arrière fatigués.
peugeot-205-rallye|T|4,3,4|I|Très légère et simple, parfaite pour apprendre. Cherche un exemplaire sain.
peugeot-205-cti|T|3,3,4|C|Cabriolet : caisse moins rigide que la GTI, donc moins précise en piste.
peugeot-205-t16|A,M|4,4,4|R|${RACE}
peugeot-306-berline|T|3,3,4|S|Correcte mais sans caractère sportif ; on préfère une version S16 ou Rallye.
peugeot-306-s16|T|3,3,4|C|Bon châssis, moteur 2.0 16V fiable. Surveille les trains arrière et les silentblocs.
peugeot-306-cabriolet|T|3,3,3|D|Caisse moins rigide : à éviter pour la piste.
peugeot-306-break|T|3,3,4|D|Break lourd, peu adapté.
peugeot-306-maxi|T|5,5,4|R|${RACE}
saxo-berline|T|3,3,4|S|Légère mais moteurs modestes : on roule vite avec peu de puissance.
saxo-vts|T|3,3,4|I|Très bonne caisse de piste économique : légère, pièces peu chères. Surveille les freins et l'embrayage.
saxo-s1600|T|5,5,5|R|${RACE}
saxo-electrique|T|1,2,3|D|Batterie qui chauffe et se vide vite : inadaptée à la piste.
peugeot-106-berline|T|3,3,4|S|Légère mais souvent fatiguée ; choisis plutôt une version sportive.
peugeot-106-xsi|T|3,3,4|C|Bonne base légère, mécanique simple. Contrôle la caisse et les trains.
peugeot-106-rallye|T|3,3,4|I|Une des meilleures caisses de piste économiques : légère, fiable, pièces faciles à trouver.
peugeot-106-s16|T|3,3,4|I|Châssis agile, moteur 16V solide. Surveille la rouille et l'état des trains.
mazda-mx5-na|P|4,3,4|I|La caisse de piste idéale pour débuter : propulsion légère et fiable. Vérifie la rouille des bas de caisse.
mazda-mx5-nb|P|4,3,4|I|Excellente base de piste, pièces et préparations abondantes. Contrôle les longerons et le différentiel.
mazda-mx5-nc|P|4,4,4|I|Plus lourde mais très fiable, bonnes préparations de série. Surveille la température d'huile en session longue.
mazda-mx5-nd|P|4,4,4|I|Légère et moderne, fiable en piste avec des plaquettes sport et un refroidissement d'huile pour le très intensif.
fiat-1000tipla|P|5,5,5|R|${RACE}
nissan-s30-240z-280z|P|3,3,3|C|Superbe mais ancienne : rouille, pièces rares et fiabilité à surveiller.
nissan-s130-280zx|P|3,3,3|C|Plus lourde et plus rare en pièces que la 240Z ; état de la caisse crucial.
nissan-z31-300zx|P|3,3,3|S|Mécanique vieillissante, pièces moins faciles à trouver.
nissan-z32-300zx|P|2,3,3|S|Compartiment moteur très serré : chauffe et entretien compliqués. Bien choisir l'exemplaire.
nissan-350z-z33|P|3,3,4|C|Bonne caisse de piste ; surveille la température d'huile, la bonne pompe et l'usure des freins.
nissan-370z-z34|P|3,4,4|C|Plus puissante et plus solide ; l'huile chauffe en piste, un radiateur d'huile est conseillé.
nissan-z-rz34|P|4,4,4|C|Moderne et performante ; les freins d'origine demandent de la vigilance en piste intensive.
nissan-skyline-gtr-classic|P|3,3,3|S|Pièces rares et chères : voiture de collection plus que de piste.
nissan-skyline-gtr-r32|A|3,3,3|C|Légende de circuit ; entretien exigeant, 4x4 ATTESA à contrôler, pièces en hausse.
nissan-skyline-gtr-r33|A|3,3,3|C|Plus lourde que la R32 mais solide ; surveille la boîte et le système 4x4.
nissan-skyline-gtr-r34|A|4,3,3|C|Très recherchée et chère ; boîte Getrag solide mais le budget d'entretien est lourd.
nissan-gt-r-r35|A|4,4,3|S|Performante mais boîte à double embrayage coûteuse en piste soutenue : entretien très cher.
nissan-silvia-classic|P|3,3,3|S|Ancienne et rare en pièces ; plutôt voiture de collection.
nissan-silvia-s13|P|3,3,4|I|Référence du drift et de la piste : propulsion légère, mécanique simple. Attention aux exemplaires déjà très modifiés.
nissan-silvia-s14|P|3,3,4|I|Bonne base de piste ; le turbo SR20DET demande un bon refroidissement.
nissan-silvia-s15|P|3,3,4|I|La plus recherchée de la famille ; bon châssis, moteur costaud. Prix élevé.
renault-clio-williams-16s|T|3,3,4|C|Collection plus que piste : rare et chère. Mécanique simple et agile.
renault-clio-2-rs|T|3,3,4|I|Excellente caisse de piste : puissante, fiable, pièces abordables. Surveille les silentblocs et les freins.
renault-clio-3-rs|T|3,4,4|I|Très efficace en piste ; contrôle l'état de la boîte et des trains avant.
renault-clio-4-rs|T|3,3,3|C|Boîte EDC peu adaptée à un usage intensif : température et usure à surveiller.
renault-megane-2-rs|T|3,3,3|C|Châssis excellent ; moteur et boîte demandent un entretien soigné. Contrôle l'état des silentblocs.
renault-megane-3-rs|T|3,4,4|I|Référence des tractions de piste : très bon châssis et freins. Embrayage à surveiller.
renault-megane-4-rs|T|3,4,3|C|Performante ; la boîte EDC chauffe en piste soutenue.
renault-clio-v6|M|2,3,3|S|Moteur central difficile d'accès, pièces chères et comportement délicat à la limite. Pour pilotes confirmés.
renault-spider|M|3,3,3|S|Très légère mais rare, sans toit ni confort. Pièces compliquées à trouver.
honda-civic-classic-generation|T|3,3,4|S|Ancienne ; état de la caisse à vérifier. Plaisante mais peu d'exemplaires sains.
honda-civic-eg6-vti|T|4,3,4|I|Excellente base de piste : légère et fiable (moteur VTEC). Vérifie la rouille.
honda-civic-ek9-type-r|T|4,3,4|C|Mythique mais très chère et souvent modifiée. Mécanique exceptionnelle.
honda-civic-ep3-type-r|T|4,3,4|I|Très bon choix de piste : moteur K20 fiable. Surveille la consommation d'huile et la boîte.
honda-civic-fn2-type-r|T|4,3,4|I|Châssis excellent, mécanique solide. Pièces abordables.
honda-civic-fk2-type-r|T|3,4,4|C|Turbo performant : surveille la température d'huile et les freins en session longue.
honda-civic-fk8-type-r|T|3,4,4|I|Référence moderne : freins et refroidissement solides. Bien suivre l'entretien.
honda-civic-fl5-type-r|T|4,4,4|I|Très aboutie pour la piste : refroidissement et freins efficaces.
peugeot-309-berline|T|3,3,4|S|Ancienne et peu recherchée ; plutôt une base de restauration.
peugeot-309-gti|T|3,3,4|C|Agile et simple ; état de la caisse à contrôler, pièces de plus en plus rares.
peugeot-406-berline-break|T|3,3,4|D|Grande berline lourde : peu adaptée à la piste.
peugeot-406-coupe|T|3,3,4|S|Beau coupé grand tourisme, plus lourd qu'une sportive de piste.
toyota-celica-supra-a40-a60|P|3,3,3|S|Ancienne et rare ; plutôt voiture de collection.
toyota-supra-a70|P|3,3,3|S|Lourde et vieillissante ; pièces difficiles.
toyota-supra-a80-mk4|P|4,3,4|C|Moteur 2JZ très solide ; pièces et prix très élevés. Boîte Getrag costaude.
toyota-supra-a90-mk5|P|4,4,4|C|Efficace en piste ; les freins d'origine peuvent s'user vite en session soutenue.
toyota-mr2-aw11|M|3,3,3|C|Légère et amusante mais ancienne ; comportement vif au lâcher d'accélérateur.
toyota-mr2-sw20|M|3,3,3|S|Comportement piégeux à la limite ; pour pilotes expérimentés.
toyota-mrs-zzw30|M|4,3,4|I|Très légère et fiable : bonne caisse de piste. Surveille la rigidité du châssis.
toyota-celica-classic|P|3,3,3|S|Ancienne ; plutôt collection.
toyota-celica-st185-st205|A|3,3,3|C|Rallye de série ; entretien du 4x4 et du turbo à surveiller.
toyota-celica-zzt231|T|3,3,4|C|Mécanique solide ; la boîte et les freins sont à surveiller.
citroen-xsara-vts|T|3,3,4|I|Bonne base de piste : moteur 2.0 16V fiable, pièces abordables.
citroen-xsara-kit-car|T|5,5,5|R|${RACE}
citroen-xsara-wrc|A|5,5,5|R|${RACE}
ford-escort-rs-cosworth-t35|A|2,3,3|S|Rare, chère et turbo exigeant : plutôt une voiture de collection.
ford-escort-rs-cosworth-t25|A|2,3,3|S|Idem T35 : très recherchée, à rouler avec prudence.
ford-sierra-rs-cosworth|P|2,3,3|S|Mythique ; boîte et turbo fragiles sous forte sollicitation.
ford-focus-rs-mk2|T|3,3,4|I|Très bonne caisse de piste : efficace et robuste. Surveille les joints de culasse et la boîte.
ford-focus-rs-mk3|A|2,4,3|S|Performante mais joint de culasse et surchauffe à surveiller sur circuit.
ford-focus-st-170|T|3,3,4|C|Bon châssis, mécanique fiable. Contrôle les trains.
ford-fiesta-st-mk6|T|3,3,4|I|Petite, légère et fiable : excellente école de pilotage à petit budget.
ford-fiesta-st-mk7|T|3,4,4|I|Très bon châssis, freins corrects. Option sport intéressante.
ford-puma-17|T|3,3,4|C|Plaisante et agile ; ancienne et rouille possible.
peugeot-406-break|T|3,3,4|D|Break lourd : à éviter pour la piste.
ford-rs200|A,M|4,4,4|R|${RACE}
peugeot-207-rc|T|2,2,3|D|Moteur THP : chauffe, calage de distribution et consommation d'huile. Freins et refroidissement à renforcer.
peugeot-207-s2000|A|5,5,5|R|${RACE}
peugeot-406-silhouette|P|5,5,5|R|${RACE}
vw-golf-gti-mk1|T|3,3,4|C|Légère et légendaire ; état de la caisse crucial.
vw-golf-gti-mk2|T|3,3,4|C|Bonne base simple ; rouille et pièces d'origine à vérifier.
vw-golf-gti-mk3|T|3,3,4|S|Plus lourde et moins vive ; peu recherchée en piste.
vw-golf-gti-mk4|T|3,3,4|C|Correcte ; mécanique fiable mais châssis peu dynamique d'origine.
vw-golf-gti-mk5|T|3,3,3|C|Efficace ; boîte DSG et turbo à surveiller en usage intensif.
vw-golf-gti-mk6|T|3,3,3|C|Très polyvalente ; surveille la température et les freins.
vw-golf-gti-mk7|T|3,4,3|I|Excellent rapport efficacité/coût ; freins corrects, DSG à ménager.
vw-golf-gti-mk8|T|3,4,3|C|Performante mais la boîte DSG chauffe en session longue.
seat-leon-fr-mk1|T|3,3,4|C|Bonne base ; mécanique fiable.
seat-leon-fr-mk2|T|3,3,3|C|Efficace ; boîte DSG à surveiller.
seat-leon-fr-mk3|T|3,4,3|C|Polyvalente ; freins à renforcer pour un usage intensif.
seat-leon-fr-mk4|T|3,3,3|S|Plus lourde et moins vive en piste.
nissan-silvia-ps13|P|3,3,4|I|Variante de la S13 : même plaisir de conduite, mécanique simple.
nissan-onevia|P|3,3,4|C|Variante rare de la S13 ; pièces plus difficiles à trouver.
nissan-sileighty|P|3,3,4|C|Mélange S13/180SX ; très recherchée pour le drift et la piste.
peugeot-206-quiksilver|T|3,3,4|S|Version de série sans réel intérêt sportif.
alfa-romeo-145|T|3,3,4|S|Atypique ; pièces compliquées, mécanique fragile à l'usure.
alfa-romeo-145-quadrifoglio-verde|T|3,3,4|C|Sportive plaisante mais ancienne : électricité et pièces à surveiller.
alfa-romeo-147|T|3,3,3|S|Correcte mais boîte Selespeed fragile ; préfère la manuelle.
alfa-romeo-147-gta|T|2,3,3|S|Superbe V6 mais lourd à l'avant et exigeant en entretien.
alfa-romeo-155|T|3,3,4|S|Ancienne ; pièces difficiles.
alfa-romeo-155-q4|A|3,3,3|S|Rare ; entretien du 4x4 à surveiller.
alfa-romeo-155-v6-ti-dtm|P|5,5,5|R|${RACE}
alfa-romeo-156|T|3,3,4|C|Bon châssis ; courroie, suspensions et boîte Selespeed à surveiller.
alfa-romeo-156-sportwagon|T|3,3,4|D|Break plus lourd : peu adapté à la piste.
alfa-romeo-156-gta|T|2,3,3|S|V6 magnifique mais lourd et exigeant : budget d'entretien important.
alfa-romeo-159|T|3,3,3|D|Lourde et peu agile ; à éviter pour la piste.
alfa-romeo-164|T|3,3,3|D|Grande berline ancienne.
alfa-romeo-164-super|T|3,3,3|D|Idem 164 ; plutôt une GT de route.
alfa-romeo-166|T|3,3,3|D|Grande berline lourde, peu adaptée.
alfa-romeo-gtv-916|T|3,3,3|S|Belle mais peu fiable ; électricité et suspensions à contrôler.
alfa-romeo-spider-916|T|3,3,3|S|Cabriolet moins rigide ; plutôt plaisir de route.
alfa-romeo-gt|T|3,3,4|C|Bon châssis ; boîte Selespeed fragile, privilégier la manuelle.
alfa-romeo-brera|T|3,3,3|S|Plus lourde ; V6 et 4x4 plus coûteux à entretenir.
alfa-romeo-spider-939|T|3,3,3|S|Cabriolet lourd : peu adapté à la piste.
alfa-romeo-mito|T|3,3,4|S|Petite et vive mais peu de puissance et freins moyens.
alfa-romeo-mito-quadrifoglio-verde|T|3,3,4|C|Efficace et amusante ; surveille les freins et le turbo.
alfa-romeo-giulietta-940|T|3,3,3|S|Correcte mais sans vocation piste ; TCT à ménager.
alfa-romeo-giulietta-quadrifoglio-verde|T|3,3,3|C|Efficace mais la boîte TCT et les freins demandent attention.
alfa-romeo-8c-competizione|X|4,4,3|S|Collection très rare et très chère ; entretien spécialisé obligatoire.
alfa-romeo-8c-spider|X|4,4,3|S|Idem 8C : exceptionnelle, mais inabordable et délicate.
alfa-romeo-4c|M|3,4,3|C|Châssis carbone excellent ; boîte TCT et direction non assistée exigeantes.
alfa-romeo-4c-spider|M|3,4,3|C|Même base ; bruyante et exigeante au quotidien.
alfa-romeo-giulia-952|P|3,4,4|C|Excellent châssis de série ; version de base peu puissante.
alfa-romeo-giulia-quadrifoglio|P|4,5,4|C|Très performante ; freins performants, boîte et électronique à suivre.
alfa-romeo-giulia-gta|P|4,5,4|I|Allégée et conçue pour la piste ; très chère.
alfa-romeo-33-stradale|M|3,3,3|S|Pièce de collection inestimable.
alfa-romeo-33-stradale-2023|M|4,4,4|S|Série très limitée ; usage piste à confier à l'usine.
alfa-romeo-giulia-sprint-gt-105|P|3,3,3|C|Collection ; légère et plaisante, mécanique simple. Rouille à vérifier.
alfa-romeo-giulia-tz|P|3,3,3|R|${RACE}
alfa-romeo-giulietta-sprint-750|P|3,2,3|S|Collection ; freins tambour d'origine inadaptés.
alfa-romeo-spider-duetto|P|3,3,3|C|Collection ; simple et amusante, rouille et freins à surveiller.
alfa-romeo-gtv6|P|3,3,3|C|Superbe sonorité ; rouille, pièces et boîte transaxle à contrôler.
alfa-romeo-8c-2300-le-mans|P|3,2,2|R|${RACE}
auto-union-type-c|R|3,2,2|R|${RACE}
auto-union-type-d|R|3,2,2|R|${RACE}
audi-quattro|A|3,3,3|C|Légende ; rare et chère, turbo et 4x4 à entretenir.
audi-sport-quattro|A|3,3,3|S|Extrêmement rare ; collection.
audi-sport-quattro-s1-e2|A|5,5,5|R|${RACE}
audi-80-b3|T,A|3,3,4|S|Ancienne ; pas de vocation sportive.
audi-80-b4|T,A|3,3,4|S|Ancienne ; cherche plutôt une S2 ou RS2.
audi-90-quattro-20v|A|3,3,4|C|Rare ; mécanique 5 cylindres plaisante mais ancienne.
audi-90-quattro-imsa-gto|A|5,5,5|R|${RACE}
audi-s2|A|3,3,3|C|Moteur 5 cylindres solide ; pièces plus rares et chères.
audi-rs2-avant|A|3,3,3|C|Mythique et très chère ; collection.
audi-v8|A|3,3,3|D|Grande berline lourde.
audi-v8-quattro-dtm|A|5,5,5|R|${RACE}
audi-a1-8x|T|3,3,3|S|Petite et vive mais peu sportive ; boîte S tronic à ménager.
audi-s1-8x|A|3,3,4|C|Petite caisse efficace ; surveille les freins.
audi-a1-quattro|A|3,3,4|C|Série limitée ; rare et chère.
audi-a1-gb|T|3,3,3|S|Version civile peu adaptée à la piste.
audi-a3-8l|T,A|3,3,4|S|Ancienne ; peu sportive d'origine.
audi-s3-8l|A|3,3,4|C|Bon rapport coût/performance ; surveille turbo et embrayage.
audi-a3-8p|T,A|3,3,3|S|Peu adaptée à la piste.
audi-s3-8p|A|3,3,3|C|Efficace ; surveille la température et le 4x4 Haldex.
audi-rs3-8p|A|3,4,3|C|Moteur 5 cylindres exceptionnel ; la boîte S tronic demande de la vigilance.
audi-a3-8v|T,A|3,3,3|S|Peu adaptée à la piste.
audi-s3-8v|A|3,4,3|C|Efficace et polyvalente ; freins et Haldex à surveiller.
audi-rs3-8v|A|3,4,3|C|Très performante ; boîte S tronic et freins à suivre de près.
audi-a3-8y|T,A|3,3,3|S|Peu adaptée à la piste.
audi-s3-8y|A|3,4,3|C|Efficace ; surveille la boîte et le refroidissement.
audi-rs3-8y|A|3,4,3|C|Très performante avec mode drift ; surveille freins et refroidissement.
audi-a4-b5|T,A|3,3,4|D|Berline lourde sans vocation piste.
audi-s4-b5|A|3,3,3|S|Plaisante mais lourde ; boîte et turbos à surveiller.
audi-rs4-b5|A|2,3,3|S|Collection ; turbos et entretien coûteux.
audi-a4-b6-b7|T,A|3,3,3|D|Berline lourde, peu adaptée.
audi-s4-b6-b7|A|3,3,3|S|V8 plaisant mais lourd ; chaîne de distribution coûteuse.
audi-rs4-b7|A|3,3,3|S|V8 4.2 magnifique ; coût d'entretien élevé et masse importante.
audi-a4-b8|T,A|3,3,3|D|Berline lourde.
audi-s4-b8|A|3,3,3|S|Efficace mais lourde ; boîte S tronic coûteuse.
audi-a4-b9|T,A|3,3,3|D|Berline lourde, peu adaptée.
audi-s4-b9|A|3,3,3|S|Efficace mais lourde.
audi-rs4-b9|A|3,4,3|S|Très rapide mais lourde et chère à entretenir en piste.
audi-a5-8t|T,A|3,3,3|S|Coupé élégant mais lourd.
audi-s5-8t|A|3,3,3|S|Efficace mais lourde ; chaîne de distribution à surveiller.
audi-rs5-8t|A|3,3,3|S|V8 4.2 plaisant ; lourde et coûteuse.
audi-a5-b9|T,A|3,3,3|S|Peu adaptée à la piste.
audi-s5-b9|A|3,3,3|S|Efficace mais lourde.
audi-rs5-b9|A|3,4,3|S|Rapide mais lourde ; freins à surveiller en piste.
audi-a6-c5|T,A|3,3,3|D|Grande berline.
audi-rs6-c5|A|2,3,3|D|Twin-turbo rapide mais très lourd et fragile à l'usage intensif.
audi-rs6-c6|A|2,3,3|D|V10 magnifique mais très lourd ; coûts énormes.
audi-a6-c7|T,A|3,3,3|D|Grande berline.
audi-s6-c7|A|3,3,3|D|Rapide mais lourde.
audi-rs6-c7|A|3,4,3|D|Rapide mais très lourde ; usure rapide des freins.
audi-a6-c8|T,A|3,3,3|D|Grande berline.
audi-rs6-c8|A|3,4,3|D|Rapide mais très lourde.
audi-s7-4g|A|3,3,3|D|Grande berline lourde.
audi-rs7-4g|A|3,4,3|D|Rapide mais très lourde.
audi-rs7-c8|A|3,4,3|D|Rapide mais très lourde.
audi-a8-d2|T,A|3,3,3|D|Limousine : aucune vocation piste.
audi-s8-d2|A|3,3,3|D|Limousine lourde.
audi-a8-d3|A|3,3,3|D|Limousine lourde.
audi-s8-d3|A|3,3,3|D|Limousine lourde.
audi-a8-d4|A|3,3,3|D|Limousine lourde.
audi-s8-d4|A|3,4,3|D|Limousine lourde.
audi-tt-8n|T,A|3,3,3|S|Coupé léger mais peu sportif d'origine.
audi-tt-8j|T,A|3,3,3|S|Coupé élégant mais peu vif en piste.
audi-tt-rs-8j|A|3,4,3|C|Moteur 5 cylindres plaisant ; surveille la boîte et la température.
audi-tt-8s|T,A|3,3,3|S|Peu adaptée à la piste.
audi-tt-rs-8s|A|3,4,3|C|Performante ; boîte et freins à surveiller.
audi-r8-v8|A,M|3,4,3|C|Supercar abordable ; boîte robotisée R tronic fragile, préférer la manuelle.
audi-r8-v10|A,M|3,4,3|C|Moteur exceptionnel ; entretien et pneus très coûteux.
audi-r8-type-4s|A,M|4,5,3|C|Très abouti ; coût d'usage élevé.
audi-r8-lms-gt3|A,M|5,5,5|R|${RACE}
audi-rs-e-tron-gt|A|2,4,3|D|Batterie et freins vite sollicités ; masse très élevée, peu adaptée à la piste.
`;

  const lm = (id) => id.indexOf("lm-") === 0;
  const table = {};
  RAW.trim().split("\n").forEach((line) => {
    const p = line.split("|");
    if (p.length < 5) return;
    const [h, b, t] = p[2].split(",").map(Number);
    table[p[0]] = { drives: p[1].split(","), track: { heat: h, brakes: b, trans: t, verdict: V[p[3]] || "correct", note: p.slice(4).join("|") } };
  });

  /** Pour les voitures de course Le Mans : propulsion/moteur central/4x4 selon l'époque (valeurs de référence). */
  function lmDrive(id) {
    if (/audi-r18-e-tron|porsche-919|toyota-ts050|toyota-gr010|ferrari-499p|toyota-tr010|peugeot-908|audi-r15|peugeot-9x8|alpine-a424|porsche-963|cadillac|bmw-m-hybrid|lamborghini-sc63|aston-valkyrie/.test(id)) return /e-tron|919|ts050|gr010|499p|tr010|9x8|a424|963|cadillac|m-hybrid|sc63|valkyrie/.test(id) ? ["A", "M"] : ["M"];
    if (/bentley|lorraine|chenard|alfa|lagonda|bugatti|delahaye|talbot|mercedes-300sl|jaguar-c-type|aston-dbr1|ferrari-166|ferrari-375|jaguar-d-type|250-tr|330-trilm|250p|250lm|ford-gt40|330-p4|jaguar-xjr|ferrari-250/.test(id)) return ["P"];
    return ["M"];
  }
  const lmNote = "Voiture de course historique ou prototype : aucune évaluation d'achat.";

  /** Applique les données à la liste de voitures (sans écraser ce que l'admin a déjà renseigné). */
  function apply(list) {
    (list || []).forEach((c) => {
      if (!c || !c.id) return;
      const t = table[c.id];
      if (t) {
        if (!Array.isArray(c.drives) || !c.drives.length) c.drives = t.drives.slice();
        if (!c.track) c.track = Object.assign({}, t.track);
      } else if (lm(c.id)) {
        if (!Array.isArray(c.drives) || !c.drives.length) c.drives = lmDrive(c.id);
        if (!c.track) c.track = { heat: 5, brakes: 5, trans: 4, verdict: "race", note: lmNote };
      }
    });
    return list;
  }
  if (typeof MOTORAUTO_DATABASE !== "undefined") apply(MOTORAUTO_DATABASE);

  // ------------------------------------------------------------------ affichage
  const esc = (v) => String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  /** « Manuelle 6 / Auto 8 » → ["Manuelle 6", "Auto 8"] (séparateurs : « / » entouré d'espaces, « ou », « , ») */
  function gearboxes(str) {
    const t = String(str || "").trim();
    if (!t || t === "—") return [];
    return t.split(/\s+\/\s+|\s+ou\s+|\s*,\s*|\s*;\s*/).map((x) => x.trim()).filter(Boolean).slice(0, 8);
  }
  const gearHtml = (str) => { const g = gearboxes(str); return g.length ? g.map((x) => `<span class="gear-chip">${esc(x)}</span>`).join("") : `<b>—</b>`; };
  /** petit schéma vu de dessus : les roues motrices sont pleines */
  function driveIcon(code, px) {
    const front = code === "T" || code === "A" || code === "E", rear = code === "P" || code === "X" || code === "M" || code === "R" || code === "A" || code === "E";
    const w = (x, y, on) => `<rect x="${x}" y="${y}" width="4" height="7" rx="1.2" class="${on ? "on" : ""}"/>`;
    return `<svg class="drive-ic" viewBox="0 0 24 28" width="${px || 18}" height="${Math.round((px || 18) * 28 / 24)}" aria-hidden="true"><rect x="6" y="2" width="12" height="24" rx="5" class="body"/>${w(1, 4, front)}${w(19, 4, front)}${w(1, 17, rear)}${w(19, 17, rear)}${code === "M" ? '<rect x="8" y="15" width="8" height="6" rx="1.5" class="eng"/>' : ""}</svg>`;
  }
  const driveChips = (car) => (car.drives || []).filter((d) => DRIVES[d]).map((d) => `<span class="drive-chip" title="${esc(DRIVES[d][1])}">${driveIcon(d, 15)}${esc(DRIVES[d][0])}</span>`).join("");
  const stars = (n) => { n = Math.max(0, Math.min(5, Math.round(Number(n) || 0))); return `<span class="rate" role="img" aria-label="${n} sur 5">${"●".repeat(n)}<i>${"●".repeat(5 - n)}</i></span>`; };
  const overall = (t) => Math.round(((t.heat + t.brakes + t.trans) / 3) * 10) / 10;
  /** bloc « Sur circuit » de la fiche : verdict, 3 notes, conseil, mise en garde légale */
  function trackHtml(car) {
    const t = car && car.track; if (!t || !VERDICTS[t.verdict]) return "";
    const v = VERDICTS[t.verdict], race = t.verdict === "race";
    const rows = race ? "" : `<div class="track-rates"><div><span>Chauffe</span>${stars(t.heat)}</div><div><span>Freins</span>${stars(t.brakes)}</div><div><span>Transmission</span>${stars(t.trans)}</div></div>`;
    return `<div class="sheet-section-head">Sur circuit</div>
      <section class="track-box verdict-${esc(t.verdict)}">
        <div class="track-head"><span class="track-badge">${esc(v[0])}</span>${race ? "" : `<span class="track-score"><b>${overall(t).toString().replace(".", ",")}</b>/5 fiabilité piste</span>`}</div>
        <p class="track-sub">${esc(v[1])}</p>${rows}
        ${t.note ? `<p class="track-note">${esc(t.note)}</p>` : ""}
        <p class="track-legal">Évaluation indicative de l'équipe, établie pour un usage intensif en sessions enchaînées. En cas de problème lié à des pièces ou à des modifications conseillées, la responsabilité incombe au professionnel qui a réalisé le montage, et non à MOTORAUTO. <a href="#/legal">En savoir plus</a></p>
      </section>`;
  }

  const api = { DRIVES, VERDICTS, apply, table, lmDrive, gearboxes, gearHtml, driveIcon, driveChips, trackHtml, overall, KINDS: Object.keys(DRIVES) };
  if (typeof module === "object" && module.exports) module.exports = api; else root.MATrack = api;
})(typeof self !== "undefined" ? self : this);
