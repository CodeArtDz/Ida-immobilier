import { useSeo } from "@/hooks/use-seo";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { COMPANY, HOST } from "@/data/legal";

export default function MentionsLegales() {
  useSeo({
    title: "Mentions légales",
    description:
      "Mentions légales de I.D.A Immobilier, agence immobilière à Marignane (13700) : éditeur, hébergeur, carte professionnelle (loi Hoguet), médiation et propriété intellectuelle.",
    canonical: COMPANY.website + "/mentions-legales",
    noIndex: true,
  });

  return (
    <LegalPage
      eyebrow="Informations légales"
      title="Mentions légales"
      intro="Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)."
    >
      <LegalSection title="Éditeur du site">
        <p>
          Le présent site est édité par <strong>{COMPANY.name}</strong>, {COMPANY.legalForm}{" "}
          au capital de {COMPANY.capital}.
        </p>
        <ul className="list-none space-y-1">
          <li>
            <strong>Siège social :</strong> {COMPANY.address}, {COMPANY.postalCode}{" "}
            {COMPANY.city}, {COMPANY.country}
          </li>
          <li>
            <strong>Téléphone :</strong>{" "}
            <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phoneDisplay}</a>
          </li>
          <li>
            <strong>Email :</strong>{" "}
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </li>
          <li>
            <strong>SIRET :</strong> {COMPANY.siret}
          </li>
          <li>
            <strong>R.C.S. :</strong> {COMPANY.rcsCity} {COMPANY.rcs}
          </li>
          <li>
            <strong>N° TVA intracommunautaire :</strong> {COMPANY.tvaIntra}
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>{COMPANY.publicationDirector}, en qualité de représentant légal.</p>
      </LegalSection>

      <LegalSection title="Activité réglementée — Carte professionnelle (loi Hoguet)">
        <p>
          {COMPANY.name} exerce une activité d'agent immobilier réglementée par la
          loi n° 70-9 du 2 janvier 1970 (loi Hoguet) et son décret d'application
          n° 72-678 du 20 juillet 1972.
        </p>
        <ul className="list-none space-y-1">
          <li>
            <strong>Carte professionnelle :</strong> {COMPANY.carteProType}
          </li>
          <li>
            <strong>Numéro :</strong> {COMPANY.cartePro}
          </li>
          <li>
            <strong>Délivrée par :</strong> {COMPANY.carteProIssuer}
          </li>
          <li>
            <strong>Garant financier :</strong> {COMPANY.guarantor} — montant de la
            garantie : {COMPANY.guarantorAmount}
          </li>
          <li>
            <strong>Assurance responsabilité civile professionnelle :</strong>{" "}
            {COMPANY.rcpInsurer} (couverture : {COMPANY.rcpScope})
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Hébergeur">
        <p>Le site est hébergé par :</p>
        <ul className="list-none space-y-1">
          <li>
            <strong>{HOST.name}</strong>
          </li>
          <li>{HOST.address}</li>
          <li>
            <strong>Téléphone :</strong> {HOST.phone}
          </li>
          <li>
            <a href={HOST.website} target="_blank" rel="noopener noreferrer">
              {HOST.website}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L'ensemble des éléments composant le site (textes, photographies,
          logotypes, marques, graphismes, structure) est la propriété exclusive de{" "}
          {COMPANY.name} ou de ses partenaires et est protégé par le Code de la
          propriété intellectuelle. Toute reproduction, représentation,
          modification ou exploitation, totale ou partielle, sans autorisation
          écrite préalable est interdite et constitue une contrefaçon
          sanctionnée par les articles L.335-2 et suivants du Code de la propriété
          intellectuelle.
        </p>
      </LegalSection>

      <LegalSection title="Médiation de la consommation">
        <p>
          Conformément aux articles L.612-1 et suivants du Code de la
          consommation, tout consommateur a le droit de recourir gratuitement à un
          médiateur de la consommation en vue de la résolution amiable d'un litige
          l'opposant à {COMPANY.name}, sous réserve d'avoir préalablement adressé
          une réclamation écrite à l'agence.
        </p>
        <ul className="list-none space-y-1">
          <li>
            <strong>Médiateur :</strong> {COMPANY.mediatorName}
          </li>
          <li>
            <strong>Site internet :</strong> {COMPANY.mediatorWebsite}
          </li>
        </ul>
        <p>
          Plateforme européenne de règlement en ligne des litiges :{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
          >
            ec.europa.eu/consumers/odr
          </a>
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement de vos données personnelles est décrit dans notre{" "}
          <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
