// Centralised legal / company information used across the legal pages.
// Values marked with TODO must be completed by the agency with its official
// registration data (only the business owner holds these figures).

export const TODO = "[à compléter]";

export const COMPANY = {
  name: "I.D.A Immobilier",
  legalForm: TODO, // ex. SARL, SAS, EI…
  capital: TODO, // ex. 10 000 €
  address: "16 avenue de la 1ère Armée Française",
  postalCode: "13700",
  city: "Marignane",
  country: "France",
  phoneDisplay: "+33 6 66 37 17 37",
  phoneHref: "+33666371737",
  email: "contact@ida-immobilier.com",
  website: "https://ida-immobilier.com",
  websiteDisplay: "ida-immobilier.com",
  siret: TODO,
  rcsCity: "Aix-en-Provence",
  rcs: TODO,
  tvaIntra: TODO,
  publicationDirector: TODO, // nom du représentant légal
  // Loi Hoguet (n° 70-9 du 2 janvier 1970)
  cartePro: TODO, // n° de carte professionnelle
  carteProType: "Transaction sur immeubles et fonds de commerce (T) et Gestion immobilière (G)",
  carteProIssuer: "CCI Aix-Marseille-Provence",
  guarantor: TODO, // garant financier (nom et adresse)
  guarantorAmount: TODO,
  // Responsabilité Civile Professionnelle
  rcpInsurer: TODO,
  rcpScope: "France",
  // Médiation de la consommation (art. L.612-1 du Code de la consommation)
  mediatorName: TODO,
  mediatorWebsite: TODO,
} as const;

export const HOST = {
  name: "Replit, Inc.",
  address: "767 Bryant St. #203, San Francisco, CA 94107, États-Unis",
  phone: TODO, // téléphone de l'hébergeur (art. 6 III LCEN)
  website: "https://replit.com",
} as const;

export const LAST_UPDATED = "8 juin 2026";

// Barème des honoraires — affichage obligatoire (arrêté du 10 janvier 2017).
// Montants TTC (TVA 20 %). Valeurs indicatives à adapter par l'agence.
export const TRANSACTION_FEES = [
  { tranche: "Jusqu'à 100 000 €", fee: "Forfait 5 000 € TTC" },
  { tranche: "De 100 001 € à 200 000 €", fee: "5 % TTC" },
  { tranche: "De 200 001 € à 400 000 €", fee: "4 % TTC" },
  { tranche: "De 400 001 € à 700 000 €", fee: "3,5 % TTC" },
  { tranche: "Au-delà de 700 000 €", fee: "3 % TTC" },
] as const;

// Loi ALUR (loi n° 89-462 modifiée, décret n° 2014-890).
// Marignane est située en zone tendue : plafonds de 10 €/m² + 3 €/m².
export const RENTAL_FEES = [
  {
    label: "Visites, constitution du dossier et rédaction du bail",
    detail: "À la charge du locataire — plafond zone tendue",
    fee: "10 € TTC / m² de surface habitable",
  },
  {
    label: "Établissement de l'état des lieux d'entrée",
    detail: "À la charge du locataire — plafond légal",
    fee: "3 € TTC / m² de surface habitable",
  },
  {
    label: "Honoraires bailleur",
    detail: "Part à la charge du bailleur (au moins égale à la part locataire)",
    fee: "Selon mandat",
  },
] as const;

// Gestion locative — librement fixés, affichés à titre d'exemple.
export const MANAGEMENT_FEES = [
  { label: "Honoraires de gestion courante", fee: "7 % TTC des sommes encaissées" },
  { label: "Honoraires de location (mise en location)", fee: "Voir barème location ci-dessus" },
] as const;
