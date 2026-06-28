// City registry seed for the programmatic SEO engine. Marignane (agency HQ)
// plus 14 communes within ~70km, each with French SEO content blocks and
// nearby-city relations for internal linking.

export interface CitySeed {
  slug: string;
  name: string;
  postalCodes: string;
  departmentCode: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number;
  nearbyCitySlugs: string;
  intro: string;
  marketContext: string;
  livingThere: string;
  buyingAdvice: string;
  sellingAdvice: string;
  metaTitle: string;
  metaDescription: string;
  displayOrder: number;
  featured: boolean;
}

const REGION = "Provence-Alpes-Côte d'Azur";
const DEPT = "Bouches-du-Rhône";

export const CITIES_SEED: CitySeed[] = [
  {
    slug: "marignane",
    name: "Marignane",
    postalCodes: "13700",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4154,
    longitude: 5.2152,
    population: 32898,
    nearbyCitySlugs: "vitrolles,saint-victoret,gignac-la-nerthe,chateauneuf-les-martigues,marseille",
    intro:
      "Idéalement située entre l'étang de Berre et la Méditerranée, Marignane est une ville dynamique des Bouches-du-Rhône qui séduit familles et investisseurs. Siège historique de I.D.A Immobilier, notre agence connaît chaque quartier de la commune sur le bout des doigts.",
    marketContext:
      "Le marché immobilier de Marignane reste accessible comparé à Marseille ou Aix-en-Provence, avec une forte demande portée par la proximité de l'aéroport Marseille-Provence et des grands pôles d'emploi. Les villas avec jardin et les appartements en résidence sécurisée constituent l'essentiel des transactions.",
    livingThere:
      "Marignane offre un cadre de vie équilibré : écoles, commerces, plages de l'étang de Berre et accès rapide à l'autoroute A55. La ville bénéficie d'une desserte aérienne exceptionnelle et d'une gare reliant Marseille en une vingtaine de minutes.",
    buyingAdvice:
      "Pour acheter à Marignane, privilégiez les secteurs résidentiels des Florides et de Notre-Dame. Nos conseillers vous accompagnent du financement à la signature pour sécuriser votre projet.",
    sellingAdvice:
      "Vendre à Marignane demande une estimation précise au prix du marché local. I.D.A Immobilier réalise une estimation gratuite et met en valeur votre bien grâce à des photos professionnelles et une diffusion ciblée.",
    metaTitle: "Immobilier à Marignane (13700) — Achat, Vente, Estimation",
    metaDescription:
      "Découvrez les biens immobiliers à vendre et à louer à Marignane avec I.D.A Immobilier. Estimation gratuite, conseil local et accompagnement personnalisé.",
    displayOrder: 1,
    featured: true,
  },
  {
    slug: "marseille",
    name: "Marseille",
    postalCodes: "13001,13002,13003,13004,13005,13006,13007,13008,13009",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.2965,
    longitude: 5.3698,
    population: 873076,
    nearbyCitySlugs: "marignane,septemes-les-vallons,les-pennes-mirabeau,aix-en-provence,vitrolles",
    intro:
      "Deuxième ville de France et capitale méditerranéenne, Marseille conjugue patrimoine, mer et art de vivre. I.D.A Immobilier vous accompagne sur l'ensemble des arrondissements, du Vieux-Port aux quartiers Sud.",
    marketContext:
      "Le marché marseillais est très contrasté selon les arrondissements : les quartiers Sud (6e, 7e, 8e) affichent des prix premium, tandis que le centre offre encore des opportunités. La demande locative y est soutenue toute l'année.",
    livingThere:
      "Entre calanques, plages et vie culturelle intense, Marseille séduit par sa diversité. Métro, tramway et bus desservent efficacement la ville, complétés par la gare Saint-Charles, hub TGV vers Paris et l'Europe.",
    buyingAdvice:
      "À Marseille, le choix de l'arrondissement est déterminant. Nos experts vous orientent vers les secteurs adaptés à votre budget et à votre projet de vie ou d'investissement locatif.",
    sellingAdvice:
      "Pour vendre à Marseille, une connaissance fine du micro-marché de votre rue est essentielle. I.D.A Immobilier valorise votre bien avec une stratégie de prix et de diffusion sur mesure.",
    metaTitle: "Immobilier à Marseille — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Marseille avec I.D.A Immobilier. Estimation gratuite et accompagnement sur tous les arrondissements.",
    displayOrder: 2,
    featured: true,
  },
  {
    slug: "aix-en-provence",
    name: "Aix-en-Provence",
    postalCodes: "13090,13100",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.5297,
    longitude: 5.4474,
    population: 147122,
    nearbyCitySlugs: "marseille,les-pennes-mirabeau,vitrolles,septemes-les-vallons,marignane",
    intro:
      "Ville d'art et d'histoire, Aix-en-Provence est l'une des adresses les plus prisées du Sud de la France. I.D.A Immobilier vous ouvre les portes d'un marché d'exception, du centre historique aux campagnes environnantes.",
    marketContext:
      "Aix affiche les prix parmi les plus élevés de la région, portés par son attractivité universitaire, touristique et résidentielle. Les hôtels particuliers, appartements de standing et bastides provençales y sont très recherchés.",
    livingThere:
      "Cours Mirabeau, marchés provençaux, université et festivals : Aix offre une qualité de vie remarquable. La ville est reliée à Marseille par autoroute et dispose d'une gare TGV à proximité.",
    buyingAdvice:
      "Acheter à Aix-en-Provence est un investissement patrimonial sûr. Nos conseillers vous aident à saisir les meilleures opportunités dans un marché tendu.",
    sellingAdvice:
      "Vendre à Aix nécessite une mise en valeur soignée pour répondre aux attentes d'une clientèle exigeante. I.D.A Immobilier déploie tous ses moyens pour vendre au meilleur prix.",
    metaTitle: "Immobilier à Aix-en-Provence — Achat, Vente, Estimation",
    metaDescription:
      "Biens d'exception à vendre et à louer à Aix-en-Provence avec I.D.A Immobilier. Estimation gratuite et expertise du marché aixois.",
    displayOrder: 3,
    featured: true,
  },
  {
    slug: "vitrolles",
    name: "Vitrolles",
    postalCodes: "13127",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4602,
    longitude: 5.2486,
    population: 33700,
    nearbyCitySlugs: "marignane,rognac,les-pennes-mirabeau,saint-victoret,berre-letang",
    intro:
      "Aux portes de l'étang de Berre, Vitrolles est une commune en plein essor, appréciée pour son accessibilité et son tissu économique dense. I.D.A Immobilier y propose un large choix de biens.",
    marketContext:
      "Le marché de Vitrolles offre un bon rapport qualité-prix, avec des maisons familiales et des appartements adaptés aux primo-accédants comme aux investisseurs.",
    livingThere:
      "Vitrolles bénéficie d'une situation stratégique près de l'aéroport, de zones commerciales majeures et de l'autoroute A7. Le rocher et les espaces naturels offrent un cadre verdoyant.",
    buyingAdvice:
      "Vitrolles est idéale pour un premier achat. Nos conseillers vous guident vers les quartiers résidentiels les plus calmes et recherchés.",
    sellingAdvice:
      "Pour vendre à Vitrolles, une estimation juste et une diffusion efficace font la différence. Faites confiance à l'expertise locale de I.D.A Immobilier.",
    metaTitle: "Immobilier à Vitrolles (13127) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Vitrolles avec I.D.A Immobilier. Estimation gratuite et conseil de proximité.",
    displayOrder: 4,
    featured: false,
  },
  {
    slug: "istres",
    name: "Istres",
    postalCodes: "13800",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.5133,
    longitude: 4.9878,
    population: 43463,
    nearbyCitySlugs: "fos-sur-mer,martigues,berre-letang,salon-de-provence,marignane",
    intro:
      "Entre étangs et collines, Istres est une ville verte et familiale de l'ouest des Bouches-du-Rhône. I.D.A Immobilier vous accompagne dans tous vos projets sur la commune.",
    marketContext:
      "Istres propose un marché accessible avec de nombreuses maisons avec jardin, prisées des familles. La demande est soutenue par le bassin d'emploi industriel et aéronautique voisin.",
    livingThere:
      "Istres allie nature et services : plages de l'étang de l'Olivier, équipements sportifs et culturels de qualité, écoles réputées. La ville est reliée à Marseille et Aix par voie rapide.",
    buyingAdvice:
      "Acheter à Istres permet d'accéder à des biens spacieux à prix maîtrisé. Nos conseillers ciblent les secteurs résidentiels les plus prisés.",
    sellingAdvice:
      "Pour vendre à Istres, I.D.A Immobilier met en avant les atouts de votre bien auprès d'acquéreurs qualifiés.",
    metaTitle: "Immobilier à Istres (13800) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Istres avec I.D.A Immobilier. Estimation gratuite et accompagnement personnalisé.",
    displayOrder: 5,
    featured: false,
  },
  {
    slug: "martigues",
    name: "Martigues",
    postalCodes: "13500",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.405,
    longitude: 5.0481,
    population: 49281,
    nearbyCitySlugs: "istres,fos-sur-mer,chateauneuf-les-martigues,berre-letang,marignane",
    intro:
      "Surnommée la « Venise provençale », Martigues séduit par ses canaux, son port et sa lumière unique. I.D.A Immobilier vous propose des biens au charme méditerranéen authentique.",
    marketContext:
      "Le marché de Martigues mêle biens de caractère en bord de canal et résidences modernes. Les prix restent attractifs au regard du cadre de vie offert.",
    livingThere:
      "Entre mer, étang de Berre et collines, Martigues offre un art de vivre provençal. Plages, port de plaisance et patrimoine pittoresque rythment le quotidien.",
    buyingAdvice:
      "Acheter à Martigues, c'est investir dans un cadre exceptionnel. Nos conseillers vous orientent du quartier de l'Île à Ferrières.",
    sellingAdvice:
      "Pour vendre à Martigues, I.D.A Immobilier valorise le charme unique de votre bien auprès d'une clientèle séduite par la région.",
    metaTitle: "Immobilier à Martigues (13500) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Martigues avec I.D.A Immobilier. Estimation gratuite et expertise locale.",
    displayOrder: 6,
    featured: false,
  },
  {
    slug: "berre-letang",
    name: "Berre-l'Étang",
    postalCodes: "13130",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4756,
    longitude: 5.169,
    population: 13700,
    nearbyCitySlugs: "rognac,vitrolles,istres,martigues,marignane",
    intro:
      "Au bord de l'étang qui lui a donné son nom, Berre-l'Étang est une commune accessible et conviviale. I.D.A Immobilier vous y accompagne dans vos projets immobiliers.",
    marketContext:
      "Berre-l'Étang offre des prix parmi les plus abordables du secteur, avec des maisons et appartements adaptés aux budgets maîtrisés et aux investisseurs.",
    livingThere:
      "La commune bénéficie d'un accès direct à l'étang, de commerces de proximité et d'une bonne desserte routière vers Marignane et Vitrolles.",
    buyingAdvice:
      "Berre-l'Étang est un bon point d'entrée pour un premier achat. Nos conseillers vous accompagnent à chaque étape.",
    sellingAdvice:
      "Pour vendre à Berre-l'Étang, comptez sur l'estimation précise et la réactivité de I.D.A Immobilier.",
    metaTitle: "Immobilier à Berre-l'Étang (13130) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Berre-l'Étang avec I.D.A Immobilier. Estimation gratuite et conseil de proximité.",
    displayOrder: 7,
    featured: false,
  },
  {
    slug: "gignac-la-nerthe",
    name: "Gignac-la-Nerthe",
    postalCodes: "13180",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.3917,
    longitude: 5.2389,
    population: 9800,
    nearbyCitySlugs: "marignane,saint-victoret,chateauneuf-les-martigues,les-pennes-mirabeau,vitrolles",
    intro:
      "Commune résidentielle au pied de la chaîne de la Nerthe, Gignac-la-Nerthe offre un cadre paisible à deux pas de Marignane. I.D.A Immobilier y connaît parfaitement le marché.",
    marketContext:
      "Le marché de Gignac-la-Nerthe est dominé par les maisons familiales et villas avec jardin, recherchées par ceux qui veulent allier tranquillité et proximité des pôles d'emploi.",
    livingThere:
      "Gignac-la-Nerthe séduit par son ambiance village, ses écoles et son accès rapide à l'A55. Un cadre idéal pour les familles.",
    buyingAdvice:
      "Acheter à Gignac-la-Nerthe, c'est privilégier le calme sans s'éloigner de Marseille. Nos conseillers vous guident vers les meilleurs secteurs.",
    sellingAdvice:
      "Pour vendre à Gignac-la-Nerthe, I.D.A Immobilier cible une clientèle familiale en quête de tranquillité.",
    metaTitle: "Immobilier à Gignac-la-Nerthe (13180) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Gignac-la-Nerthe avec I.D.A Immobilier. Estimation gratuite et expertise locale.",
    displayOrder: 8,
    featured: false,
  },
  {
    slug: "saint-victoret",
    name: "Saint-Victoret",
    postalCodes: "13730",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4019,
    longitude: 5.2475,
    population: 6600,
    nearbyCitySlugs: "marignane,gignac-la-nerthe,vitrolles,les-pennes-mirabeau,chateauneuf-les-martigues",
    intro:
      "Petite commune résidentielle limitrophe de Marignane, Saint-Victoret offre un cadre de vie calme et bien desservi. I.D.A Immobilier y propose un suivi de proximité.",
    marketContext:
      "Saint-Victoret attire les familles avec ses maisons individuelles et son atmosphère paisible, à prix raisonnable pour le secteur.",
    livingThere:
      "Commerces, écoles et accès rapide à l'aéroport et aux grands axes font de Saint-Victoret un lieu pratique et agréable.",
    buyingAdvice:
      "Acheter à Saint-Victoret, c'est profiter d'un environnement calme proche de tout. Nos conseillers vous accompagnent.",
    sellingAdvice:
      "Pour vendre à Saint-Victoret, I.D.A Immobilier valorise la tranquillité et la situation de votre bien.",
    metaTitle: "Immobilier à Saint-Victoret (13730) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Saint-Victoret avec I.D.A Immobilier. Estimation gratuite et conseil local.",
    displayOrder: 9,
    featured: false,
  },
  {
    slug: "chateauneuf-les-martigues",
    name: "Châteauneuf-les-Martigues",
    postalCodes: "13220",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.3858,
    longitude: 5.1644,
    population: 18000,
    nearbyCitySlugs: "martigues,marignane,gignac-la-nerthe,saint-victoret,vitrolles",
    intro:
      "Entre étang de Berre et massif de la Nerthe, Châteauneuf-les-Martigues offre un équilibre rare entre nature et accessibilité. I.D.A Immobilier vous y accompagne.",
    marketContext:
      "Le marché local propose villas, maisons et appartements à des prix attractifs, soutenu par la proximité des zones d'emploi de l'étang de Berre.",
    livingThere:
      "La commune, avec son village de la Mède et ses espaces naturels, séduit les familles. Accès direct à l'A55 vers Marseille.",
    buyingAdvice:
      "Châteauneuf-les-Martigues est idéale pour les familles. Nos conseillers vous orientent vers les quartiers les plus prisés.",
    sellingAdvice:
      "Pour vendre à Châteauneuf-les-Martigues, comptez sur l'expertise et la réactivité de I.D.A Immobilier.",
    metaTitle: "Immobilier à Châteauneuf-les-Martigues (13220) — Achat, Vente",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Châteauneuf-les-Martigues avec I.D.A Immobilier. Estimation gratuite et conseil local.",
    displayOrder: 10,
    featured: false,
  },
  {
    slug: "les-pennes-mirabeau",
    name: "Les Pennes-Mirabeau",
    postalCodes: "13170",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4106,
    longitude: 5.3083,
    population: 21500,
    nearbyCitySlugs: "vitrolles,marignane,septemes-les-vallons,marseille,gignac-la-nerthe",
    intro:
      "Aux portes de Marseille et d'Aix, Les Pennes-Mirabeau est une commune résidentielle prisée pour son cadre verdoyant. I.D.A Immobilier y propose de belles opportunités.",
    marketContext:
      "Le marché des Pennes-Mirabeau est dynamique, porté par une forte demande de maisons et villas dans un environnement préservé.",
    livingThere:
      "Entre collines et pinèdes, la commune offre un cadre de vie agréable, des écoles et un accès rapide aux autoroutes A7 et A51.",
    buyingAdvice:
      "Acheter aux Pennes-Mirabeau, c'est concilier nature et proximité des grandes villes. Nos conseillers vous guident.",
    sellingAdvice:
      "Pour vendre aux Pennes-Mirabeau, I.D.A Immobilier met en valeur le cadre de vie recherché de la commune.",
    metaTitle: "Immobilier aux Pennes-Mirabeau (13170) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer aux Pennes-Mirabeau avec I.D.A Immobilier. Estimation gratuite et expertise locale.",
    displayOrder: 11,
    featured: false,
  },
  {
    slug: "rognac",
    name: "Rognac",
    postalCodes: "13340",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4889,
    longitude: 5.2333,
    population: 12200,
    nearbyCitySlugs: "vitrolles,berre-letang,marignane,les-pennes-mirabeau,saint-victoret",
    intro:
      "Au bord de l'étang de Berre, Rognac est une commune familiale bien connectée. I.D.A Immobilier vous accompagne dans vos projets sur la ville.",
    marketContext:
      "Rognac offre un marché accessible avec maisons de ville et appartements, apprécié des primo-accédants et des familles.",
    livingThere:
      "La commune dispose de commerces, d'une gare et d'un accès direct à l'A7, idéale pour les actifs travaillant à Marseille ou Aix.",
    buyingAdvice:
      "Acheter à Rognac permet d'accéder à un bon rapport qualité-prix près des grands axes. Nos conseillers vous accompagnent.",
    sellingAdvice:
      "Pour vendre à Rognac, I.D.A Immobilier déploie une stratégie de diffusion efficace auprès d'acquéreurs ciblés.",
    metaTitle: "Immobilier à Rognac (13340) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Rognac avec I.D.A Immobilier. Estimation gratuite et conseil de proximité.",
    displayOrder: 12,
    featured: false,
  },
  {
    slug: "septemes-les-vallons",
    name: "Septèmes-les-Vallons",
    postalCodes: "13240",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.3989,
    longitude: 5.3683,
    population: 11000,
    nearbyCitySlugs: "marseille,les-pennes-mirabeau,vitrolles,aix-en-provence,marignane",
    intro:
      "Aux portes nord de Marseille, Septèmes-les-Vallons offre un cadre résidentiel niché dans les collines. I.D.A Immobilier connaît bien ce marché de proximité.",
    marketContext:
      "Le marché de Septèmes-les-Vallons attire les familles cherchant une maison proche de Marseille à prix plus doux que le centre-ville.",
    livingThere:
      "Entre vallons et nature, la commune dispose d'écoles, de commerces et d'un accès rapide à l'A7 et au métro marseillais.",
    buyingAdvice:
      "Acheter à Septèmes-les-Vallons, c'est rester proche de Marseille tout en profitant du calme. Nos conseillers vous orientent.",
    sellingAdvice:
      "Pour vendre à Septèmes-les-Vallons, I.D.A Immobilier valorise la proximité de Marseille et le cadre verdoyant.",
    metaTitle: "Immobilier à Septèmes-les-Vallons (13240) — Achat, Vente",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Septèmes-les-Vallons avec I.D.A Immobilier. Estimation gratuite et expertise locale.",
    displayOrder: 13,
    featured: false,
  },
  {
    slug: "fos-sur-mer",
    name: "Fos-sur-Mer",
    postalCodes: "13270",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.4383,
    longitude: 4.9447,
    population: 15700,
    nearbyCitySlugs: "istres,martigues,berre-letang,salon-de-provence,marignane",
    intro:
      "Entre golfe et zone industrialo-portuaire, Fos-sur-Mer conjugue dynamisme économique et littoral préservé. I.D.A Immobilier vous y accompagne.",
    marketContext:
      "Le marché de Fos-sur-Mer est soutenu par le bassin d'emploi portuaire, avec une demande locative et résidentielle régulière à prix abordable.",
    livingThere:
      "Plages, port de plaisance et nature sauvage caractérisent Fos-sur-Mer. La commune offre tous les services du quotidien.",
    buyingAdvice:
      "Acheter à Fos-sur-Mer est intéressant pour un investissement locatif soutenu par l'emploi local. Nos conseillers vous guident.",
    sellingAdvice:
      "Pour vendre à Fos-sur-Mer, I.D.A Immobilier cible acquéreurs et investisseurs attirés par le dynamisme local.",
    metaTitle: "Immobilier à Fos-sur-Mer (13270) — Achat, Vente, Estimation",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Fos-sur-Mer avec I.D.A Immobilier. Estimation gratuite et conseil local.",
    displayOrder: 14,
    featured: false,
  },
  {
    slug: "salon-de-provence",
    name: "Salon-de-Provence",
    postalCodes: "13300",
    departmentCode: "13",
    department: DEPT,
    region: REGION,
    latitude: 43.6406,
    longitude: 5.0972,
    population: 45700,
    nearbyCitySlugs: "istres,berre-letang,fos-sur-mer,rognac,marignane",
    intro:
      "Ville d'histoire au cœur de la Provence, Salon-de-Provence séduit par son patrimoine et sa qualité de vie. I.D.A Immobilier vous accompagne sur ce marché attractif.",
    marketContext:
      "Salon-de-Provence offre un marché varié, des appartements du centre historique aux villas de périphérie, avec une demande soutenue et des prix mesurés.",
    livingThere:
      "Château de l'Empéri, marchés provençaux, écoles et base aérienne : Salon allie patrimoine et vie active. Accès direct aux autoroutes A7 et A54.",
    buyingAdvice:
      "Acheter à Salon-de-Provence, c'est investir dans une ville authentique et vivante. Nos conseillers vous accompagnent dans votre recherche.",
    sellingAdvice:
      "Pour vendre à Salon-de-Provence, I.D.A Immobilier valorise le charme provençal et les atouts de votre bien.",
    metaTitle: "Immobilier à Salon-de-Provence (13300) — Achat, Vente",
    metaDescription:
      "Biens immobiliers à vendre et à louer à Salon-de-Provence avec I.D.A Immobilier. Estimation gratuite et expertise du marché salonais.",
    displayOrder: 15,
    featured: false,
  },
];
