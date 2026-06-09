// Deterministic extraction of property fields from the plain text of a
// "fiche privée" PDF. No AI/LLM — pure French real-estate label heuristics.
// Only fields that can be confidently identified are returned; the admin
// reviews and completes the rest in the new-property form before saving.

export type FicheField =
  | "title" | "type" | "address" | "city" | "postalCode" | "department"
  | "residenceName" | "salePrice" | "rentalPrice" | "charges" | "agencyFees"
  | "taxeFonciere" | "livingArea" | "landArea" | "carrezArea" | "livingRoomArea"
  | "garageArea" | "gardenArea" | "terraceArea" | "rooms" | "bedrooms"
  | "bathrooms" | "showerRooms" | "toilets" | "floor" | "totalFloors" | "levels"
  | "indoorParking" | "outdoorParking" | "yearBuilt" | "orientation" | "heating"
  | "kitchen" | "water" | "sanitation" | "dpeRating" | "gesRating"
  | "energyConsumption" | "gesEmissions" | "annualEnergyCost" | "fullDescription"
  | "hasTerrace" | "hasBalcony" | "hasGarden" | "hasPool" | "hasGarage"
  | "hasParking" | "hasCellar" | "hasElevator" | "hasAirConditioning"
  | "hasFiber" | "hasFireplace" | "hasDisabledAccess";

export type FicheData = Partial<Record<FicheField, string | number | boolean>>;

const TYPE_LABELS: Record<string, string> = {
  apartment: "Appartement",
  house: "Maison",
  villa: "Villa",
  land: "Terrain",
  commercial: "Local commercial",
  building: "Immeuble",
  programme: "Programme neuf",
  garage: "Garage",
};

// Order matters: more specific terms first so "villa"/"studio" win over generic ones.
const TYPE_KEYWORDS: [RegExp, string][] = [
  [/\bvilla\b/i, "villa"],
  [/\bmaison\b/i, "house"],
  [/\b(appartement|appart\b|studio|duplex|loft)\b/i, "apartment"],
  [/\b(local\s+commercial|commerce|fonds\s+de\s+commerce|bureaux?)\b/i, "commercial"],
  [/\bimmeuble\b/i, "building"],
  [/\bprogramme(\s+neuf)?\b/i, "programme"],
  [/\bterrain\b/i, "land"],
  [/\b(garage|box)\b/i, "garage"],
];

const ORIENTATIONS = [
  "Nord-Est", "Nord-Ouest", "Sud-Est", "Sud-Ouest", "Nord", "Sud", "Est", "Ouest",
];

/** Parse a French-formatted number ("350 000", "85,5", "1.250.000"). */
function parseFrNumber(s: string): number | undefined {
  let t = s.replace(/[\u00A0\u202F'\s]/g, "");
  if (!t) return undefined;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (t.includes(".")) {
    const tail = t.match(/\.(\d+)$/);
    // A trailing group of exactly 3 digits is a thousands separator, not a decimal.
    if (tail && tail[1].length === 3) t = t.replace(/\./g, "");
  }
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : undefined;
}

/** Returns the first line that matches the given label pattern. */
function labelLine(text: string, labelRe: RegExp): string | undefined {
  return text.split(/\r?\n+/).find((l) => labelRe.test(l));
}

/** Captures the value following a label on the same line. */
function labelValue(text: string, labelRe: RegExp): string | undefined {
  const line = labelLine(text, labelRe);
  if (!line) return undefined;
  const v = line.replace(labelRe, "").replace(/^\s*[:\-–]?\s*/, "").trim();
  return v.length ? v : undefined;
}

/** Finds the first number that appears after any of the given label fragments. */
function findNum(text: string, labels: string[], unit?: string): number | undefined {
  for (const lab of labels) {
    const re = new RegExp(
      `${lab}\\s*[:\\-–]?\\s*([0-9][0-9 .,\\u00A0\\u202F']*)${unit ? `\\s*(?:${unit})` : ""}`,
      "i",
    );
    const m = text.match(re);
    if (m) {
      const n = parseFrNumber(m[1]);
      if (n !== undefined) return n;
    }
  }
  return undefined;
}

/** Finds a single DPE/GES class letter (A–G) after a label. */
function findLetter(text: string, labels: string[]): string | undefined {
  for (const lab of labels) {
    const re = new RegExp(`${lab}\\s*[:\\-–]?\\s*\\(?\\s*([A-G])\\b`, "i");
    const m = text.match(re);
    if (m) return m[1].toUpperCase();
  }
  return undefined;
}

const AREA_UNIT = "m\\s*(?:²|2|\\^2)";

export function parseFiche(rawText: string): FicheData {
  // Normalise exotic whitespace so label regexes behave predictably.
  const text = rawText.replace(/[\u00A0\u202F]/g, " ").replace(/[ \t]+/g, " ");
  const lower = text.toLowerCase();
  const data: FicheData = {};

  // ── Type ──
  let type: string | undefined;
  for (const [re, value] of TYPE_KEYWORDS) {
    if (re.test(text)) {
      type = value;
      data.type = value;
      break;
    }
  }

  // ── Location ──
  const cpLine = labelLine(text, /code\s*postal|\bcp\b/i);
  const postalCode =
    (cpLine?.match(/\b(\d{5})\b/) ?? text.match(/\b(\d{5})\b/))?.[1];
  if (postalCode) data.postalCode = postalCode;

  let city: string | undefined;
  const cityMatch = text.match(
    /\b(?:ville|commune)\b\s*[:\-–]?\s*([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\- ]{1,40})/i,
  );
  if (cityMatch) city = cityMatch[1];
  if (!city) {
    const m = text.match(/\b\d{5}\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\- ]{1,40})/);
    if (m) city = m[1];
  }
  if (city) data.city = city.split(/\r?\n/)[0].replace(/\s{2,}.*$/, "").trim();

  const address = labelValue(text, /\b(adresse|situation|localisation)\b/i);
  if (address) data.address = address;

  const department = labelValue(text, /\bd(é|e)partement\b/i);
  if (department) data.department = department;

  const residence = labelValue(text, /\b(r(é|e)sidence|copropri(é|e)t(é|e)|programme)\b/i);
  if (residence && residence.length <= 60) data.residenceName = residence;

  // ── Pricing ──
  const salePrice = findNum(text, ["prix\\s+de\\s+vente", "prix\\s+net\\s+vendeur", "prix\\s+fai", "prix"], "€|euros?");
  if (salePrice) data.salePrice = salePrice;

  const rentalPrice = findNum(text, ["loyer\\s+(?:mensuel|cc|hc|hors\\s+charges)", "loyer"], "€|euros?");
  if (rentalPrice) data.rentalPrice = rentalPrice;

  const charges = findNum(text, ["charges\\s+mensuelles", "charges\\s+de\\s+copropri(?:é|e)t(?:é|e)", "charges"], "€|euros?");
  if (charges) data.charges = charges;

  const agencyFees = findNum(text, ["honoraires", "frais\\s+d['’]agence"], "€|euros?|%");
  if (agencyFees) data.agencyFees = agencyFees;

  const taxeFonciere = findNum(text, ["taxe\\s+fonci(?:è|e)re"], "€|euros?");
  if (taxeFonciere) data.taxeFonciere = taxeFonciere;

  // ── Areas ──
  const livingArea = findNum(text, ["surface\\s+habitable", "surface\\s+hab", "surf\\.?\\s+habitable"], AREA_UNIT);
  if (livingArea) data.livingArea = livingArea;

  const carrezArea = findNum(text, ["surface\\s+carrez", "loi\\s+carrez", "carrez"], AREA_UNIT);
  if (carrezArea) data.carrezArea = carrezArea;

  const landArea = findNum(text, ["surface\\s+(?:du\\s+)?terrain", "surface\\s+parcelle", "terrain\\s+de"], AREA_UNIT);
  if (landArea) data.landArea = landArea;

  const livingRoomArea = findNum(text, ["surface\\s+s(?:é|e)jour", "s(?:é|e)jour\\s+de"], AREA_UNIT);
  if (livingRoomArea) data.livingRoomArea = livingRoomArea;

  const garageArea = findNum(text, ["surface\\s+garage"], AREA_UNIT);
  if (garageArea) data.garageArea = garageArea;

  const gardenArea = findNum(text, ["surface\\s+jardin"], AREA_UNIT);
  if (gardenArea) data.gardenArea = gardenArea;

  const terraceArea = findNum(text, ["surface\\s+terrasse"], AREA_UNIT);
  if (terraceArea) data.terraceArea = terraceArea;

  // ── Counts ──
  let rooms = findNum(text, ["nombre\\s+de\\s+pi(?:è|e)ces", "pi(?:è|e)ces"]);
  if (rooms === undefined) {
    const tf = text.match(/\b([TF])\s?(\d{1,2})\b/);
    if (tf) rooms = parseInt(tf[2], 10);
    else if (/\bstudio\b/i.test(text)) rooms = 1;
  }
  if (rooms !== undefined) data.rooms = Math.round(rooms);

  const bedrooms = findNum(text, ["nombre\\s+de\\s+chambres", "chambres?"]);
  if (bedrooms !== undefined) data.bedrooms = Math.round(bedrooms);

  const bathrooms = findNum(text, ["salles?\\s+de\\s+bains?", "sdb"]);
  if (bathrooms !== undefined) data.bathrooms = Math.round(bathrooms);

  const showerRooms = findNum(text, ["salles?\\s+d['’]eau"]);
  if (showerRooms !== undefined) data.showerRooms = Math.round(showerRooms);

  const toilets = findNum(text, ["nombre\\s+de\\s+wc", "toilettes", "wc"]);
  if (toilets !== undefined) data.toilets = Math.round(toilets);

  // Floor: handle both "3ème étage" and "étage : 3".
  const floorMatch =
    text.match(/(\d{1,2})\s*(?:er|ère|ème|eme|e)\s+(?:é|e)tage/i) ??
    text.match(/(?:é|e)tage\s*[:\-–]?\s*(\d{1,2})\b/i);
  if (floorMatch) data.floor = parseInt(floorMatch[1], 10);
  if (/rez[\s-]?de[\s-]?chauss(?:é|e)e|\brdc\b/i.test(text) && data.floor === undefined) {
    data.floor = 0;
  }

  const totalFloors = findNum(text, ["nombre\\s+d['’](?:é|e)tages", "(?:é|e)tages\\s+total"]);
  if (totalFloors !== undefined) data.totalFloors = Math.round(totalFloors);

  const levels = findNum(text, ["nombre\\s+de\\s+niveaux", "niveaux"]);
  if (levels !== undefined) data.levels = Math.round(levels);

  const indoorParking = findNum(text, ["parkings?\\s+int(?:é|e)rieurs?", "stationnements?\\s+int(?:é|e)rieurs?"]);
  if (indoorParking !== undefined) data.indoorParking = Math.round(indoorParking);

  const outdoorParking = findNum(text, ["parkings?\\s+ext(?:é|e)rieurs?", "stationnements?\\s+ext(?:é|e)rieurs?"]);
  if (outdoorParking !== undefined) data.outdoorParking = Math.round(outdoorParking);

  const year = findNum(text, ["ann(?:é|e)e\\s+de\\s+construction", "construit\\s+en", "construction"]);
  if (year !== undefined && year >= 1700 && year <= 2100) data.yearBuilt = Math.round(year);

  // ── Energy / DPE ──
  const dpe = findLetter(text, ["dpe", "classe\\s+(?:é|e)nerg(?:é|e)tique", "classe\\s+(?:é|e)nergie"]);
  if (dpe) data.dpeRating = dpe;

  const ges = findLetter(text, ["ges", "gaz\\s+(?:à|a)\\s+effet\\s+de\\s+serre"]);
  if (ges) data.gesRating = ges;

  const consoMatch = text.match(/([0-9][0-9 .,]*)\s*kwh/i);
  if (consoMatch) {
    const n = parseFrNumber(consoMatch[1]);
    if (n !== undefined) data.energyConsumption = n;
  }
  const gesEmMatch = text.match(/([0-9][0-9 .,]*)\s*kg\s*(?:(?:é|e)q\.?)?\s*co\s*2/i);
  if (gesEmMatch) {
    const n = parseFrNumber(gesEmMatch[1]);
    if (n !== undefined) data.gesEmissions = n;
  }
  const energyCost = findNum(text, ["co(?:û|u)t\\s+(?:annuel|(?:é|e)nerg)", "d(?:é|e)penses?\\s+(?:é|e)nerg(?:é|e)tiques?"], "€|euros?");
  if (energyCost) data.annualEnergyCost = energyCost;

  // ── Constrained selects (only set when the value matches an allowed option) ──
  const orientationScope = labelLine(text, /\b(exposition|orientation)\b/i);
  if (orientationScope) {
    for (const o of ORIENTATIONS) {
      const re = new RegExp(`\\b${o.replace("-", "[\\s-]?")}\\b`, "i");
      if (re.test(orientationScope)) {
        data.orientation = o;
        break;
      }
    }
  }

  const heatingScope = labelLine(text, /\bchauffage\b/i) ?? "";
  const heating = mapHeating(heatingScope || lower);
  if (heating) data.heating = heating;

  const kitchenScope = labelLine(text, /\bcuisine\b/i) ?? "";
  const kitchen = mapKitchen(kitchenScope);
  if (kitchen) data.kitchen = kitchen;

  const waterScope = labelLine(text, /\beau\b/i) ?? "";
  if (/individuel/i.test(waterScope)) data.water = "Individuel";
  else if (/collectif/i.test(waterScope)) data.water = "Collectif";

  if (/tout\s*(?:à|a)\s*l['’](?:é|e)gout/i.test(text)) data.sanitation = "Tout à l'égout";
  else if (/micro[\s-]?station/i.test(text)) data.sanitation = "Micro-station";
  else if (/fosse\s+septique/i.test(text)) data.sanitation = "Fosse septique";
  else if (/assainissement\s+individuel/i.test(text)) data.sanitation = "Assainissement individuel";

  // ── Equipment (presence-based; admin reviews) ──
  const equip: [FicheField, RegExp][] = [
    ["hasPool", /piscine/i],
    ["hasTerrace", /terrasse/i],
    ["hasBalcony", /balcon/i],
    ["hasGarden", /jardin/i],
    ["hasGarage", /\b(garage|box)\b/i],
    ["hasParking", /parking|stationnement/i],
    ["hasCellar", /\bcave\b/i],
    ["hasElevator", /ascenseur/i],
    ["hasAirConditioning", /climatis/i],
    ["hasFiber", /fibre(\s+optique)?/i],
    ["hasFireplace", /chemin(é|e)e/i],
    ["hasDisabledAccess", /acc(?:è|e)s\s+(?:handicap(?:é|e)|pmr)|\bpmr\b/i],
  ];
  for (const [field, re] of equip) {
    if (re.test(lower)) data[field] = true;
  }

  // ── Description ──
  const descIdx = text.search(/\b(descriptif|description|commentaires?|pr(é|e)sentation)\b/i);
  if (descIdx >= 0) {
    let chunk = text.slice(descIdx).replace(/^[^\n:]*[:\n]/, "").trim();
    chunk = chunk.replace(/\s{2,}/g, " ").slice(0, 1500).trim();
    if (chunk.length >= 30) data.fullDescription = chunk;
  }

  // ── Title (use an explicit label, else build a sensible default) ──
  const explicitTitle = labelValue(text, /\b(titre|d(é|e)signation|intitul(é|e))\b/i);
  if (explicitTitle && explicitTitle.length <= 120) {
    data.title = explicitTitle;
  } else if (type) {
    const parts = [TYPE_LABELS[type]];
    if (data.rooms) parts.push(`${data.rooms} pièces`);
    let t = parts.filter(Boolean).join(" ");
    if (data.city) t += ` - ${data.city}`;
    data.title = t;
  }

  return data;
}

function mapHeating(s: string): string | undefined {
  const t = s.toLowerCase();
  if (/pompe\s*(?:à|a)\s*chaleur|\bpac\b/.test(t)) return "Pompe à chaleur";
  if (/g(?:é|e)othermie/.test(t)) return "Géothermie";
  if (/solaire/.test(t)) return "Solaire";
  if (/bois|pellet|granul(?:é|e)s/.test(t)) return "Bois / Pellets";
  if (/fuel|fioul/.test(t)) return "Fuel";
  if (/gaz/.test(t)) return /collectif/.test(t) ? "Collectif gaz" : "Individuel gaz";
  if (/(?:é|e)lectri/.test(t)) return "Électrique";
  return undefined;
}

function mapKitchen(s: string): string | undefined {
  const t = s.toLowerCase();
  if (!t) return undefined;
  const nonEquipped = /non\s*(?:é|e)quip/.test(t);
  if (/am(?:é|e)ricaine/.test(t)) return nonEquipped ? "Américaine non équipée" : "Américaine équipée";
  if (/s(?:é|e)par(?:é|e)e/.test(t)) return nonEquipped ? "Séparée non équipée" : "Séparée équipée";
  if (/coin\s+cuisine|kitchenette/.test(t)) return "Coin cuisine";
  if (/cuisine\s+d['’](?:é|e)t(?:é|e)/.test(t)) return "Cuisine d'été";
  return undefined;
}
