import { useSeo } from "@/hooks/use-seo";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { COMPANY } from "@/data/legal";

export default function Confidentialite() {
  useSeo({
    title: "Politique de confidentialité",
    description:
      "Politique de confidentialité de I.D.A Immobilier conforme au RGPD : données collectées, finalités, durées de conservation, droits des personnes et gestion des cookies.",
    canonical: COMPANY.website + "/confidentialite",
    noIndex: true,
  });

  return (
    <LegalPage
      eyebrow="Protection des données"
      title="Politique de confidentialité"
      intro="Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée (« Informatique et Libertés »)."
    >
      <LegalSection title="Responsable du traitement">
        <p>
          Le responsable du traitement des données collectées sur ce site est{" "}
          <strong>{COMPANY.name}</strong>, dont le siège est situé {COMPANY.address},{" "}
          {COMPANY.postalCode} {COMPANY.city}.
        </p>
        <p>
          Pour toute question relative à vos données :{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> —{" "}
          <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phoneDisplay}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>Nous collectons les données que vous nous communiquez directement :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Identité : nom, prénom, civilité ;</li>
          <li>Coordonnées : adresse email, numéro de téléphone, adresse postale ;</li>
          <li>
            Projet immobilier : critères de recherche, biens favoris, demandes
            d'estimation et de visite, messages adressés à l'agence ;
          </li>
          <li>
            Données de navigation : adresse IP, pages consultées, données de
            connexion (cookies, voir ci-dessous).
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Répondre à vos demandes</strong> (contact, estimation, visite) —
            base légale : mesures précontractuelles à votre demande ;
          </li>
          <li>
            <strong>Gérer votre espace client</strong> (favoris, alertes, rendez-vous)
            — base légale : exécution du contrat ;
          </li>
          <li>
            <strong>Vous adresser des alertes et informations</strong> sur des biens —
            base légale : votre consentement ;
          </li>
          <li>
            <strong>Respecter nos obligations légales</strong> (lutte contre le
            blanchiment, conservation des mandats) — base légale : obligation légale.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Destinataires des données">
        <p>
          Vos données sont destinées aux services internes de {COMPANY.name} (agents
          et personnel habilité) et, le cas échéant, à nos sous-traitants techniques
          (hébergeur, outils de gestion) agissant sur instruction et dans le cadre
          d'engagements de confidentialité. Vos données ne sont jamais vendues à des
          tiers.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <ul className="list-disc pl-5 space-y-1">
          <li>Prospects sans suite : 3 ans à compter du dernier contact ;</li>
          <li>Clients : durée de la relation contractuelle puis archivage légal ;</li>
          <li>
            Documents liés aux transactions : conservés conformément aux obligations
            légales et comptables (jusqu'à 10 ans) ;
          </li>
          <li>Cookies : 13 mois maximum.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification,
          d'effacement, d'opposition, de limitation du traitement, de portabilité de
          vos données, ainsi que du droit de définir des directives relatives à leur
          sort après votre décès.
        </p>
        <p>
          Pour exercer ces droits, contactez-nous à{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ou par courrier à
          l'adresse du siège, accompagné d'un justificatif d'identité.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL :{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            www.cnil.fr
          </a>{" "}
          — 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site utilise des cookies nécessaires à son fonctionnement ainsi que,
          sous réserve de votre consentement, des cookies de mesure d'audience. Les
          cookies strictement nécessaires ne requièrent pas de consentement. Vous
          pouvez à tout moment configurer votre navigateur pour refuser les cookies
          ou être averti de leur dépôt.
        </p>
      </LegalSection>

      <LegalSection title="Transferts de données hors Union européenne">
        <p>
          Notre site est hébergé par un prestataire situé aux États-Unis (Replit,
          Inc.). À ce titre, certaines de vos données peuvent être transférées en
          dehors de l'Union européenne et de l'Espace économique européen.
        </p>
        <p>
          Ces transferts sont encadrés par les garanties appropriées prévues par le
          RGPD (articles 44 et suivants), notamment la conclusion de clauses
          contractuelles types adoptées par la Commission européenne, afin
          d'assurer un niveau de protection équivalent à celui garanti au sein de
          l'Union européenne. Vous pouvez obtenir une copie de ces garanties en nous
          contactant à <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          {COMPANY.name} met en œuvre des mesures techniques et organisationnelles
          appropriées afin de protéger vos données contre toute perte, accès non
          autorisé, altération ou divulgation.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
