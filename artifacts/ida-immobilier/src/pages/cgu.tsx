import { useSeo } from "@/hooks/use-seo";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { COMPANY } from "@/data/legal";

export default function CGU() {
  useSeo({
    title: "Conditions générales d'utilisation",
    description:
      "Conditions générales d'utilisation du site I.D.A Immobilier : objet, accès au service, propriété intellectuelle, responsabilité et droit applicable.",
    canonical: COMPANY.website + "/cgu",
    noIndex: true,
  });

  return (
    <LegalPage
      eyebrow="Conditions d'utilisation"
      title="Conditions générales d'utilisation"
      intro="Les présentes conditions régissent l'utilisation du site internet de I.D.A Immobilier. En accédant au site, vous acceptez de vous y conformer."
    >
      <LegalSection title="Article 1 — Objet">
        <p>
          Les présentes conditions générales d'utilisation (CGU) ont pour objet de
          définir les modalités de mise à disposition et d'utilisation du site{" "}
          <a href={COMPANY.website}>{COMPANY.websiteDisplay}</a> édité par{" "}
          {COMPANY.name}. Tout accès et toute utilisation du site supposent
          l'acceptation pleine et entière des présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="Article 2 — Accès au site">
        <p>
          Le site est accessible gratuitement à tout utilisateur disposant d'un
          accès à internet. Les frais d'accès et d'équipement restent à la charge de
          l'utilisateur. {COMPANY.name} s'efforce d'assurer un accès permanent au
          site mais ne saurait être tenue responsable d'une interruption, qu'elle
          soit volontaire (maintenance, mises à jour) ou indépendante de sa volonté.
        </p>
      </LegalSection>

      <LegalSection title="Article 3 — Espace client">
        <p>
          Certaines fonctionnalités (favoris, alertes, prise de rendez-vous,
          messagerie) nécessitent la création d'un compte. L'utilisateur s'engage à
          fournir des informations exactes et à préserver la confidentialité de ses
          identifiants. Il est seul responsable des actions effectuées depuis son
          compte.
        </p>
      </LegalSection>

      <LegalSection title="Article 4 — Propriété intellectuelle">
        <p>
          L'ensemble des contenus du site (textes, images, annonces, charte
          graphique, logos) est protégé par le droit de la propriété intellectuelle.
          Toute reproduction ou réutilisation sans autorisation préalable est
          interdite. Les annonces immobilières sont fournies à titre informatif et ne
          constituent pas une offre contractuelle.
        </p>
      </LegalSection>

      <LegalSection title="Article 5 — Responsabilité">
        <p>
          Les informations diffusées sur le site (descriptifs, prix, surfaces,
          diagnostics) sont communiquées à titre indicatif et sans valeur
          contractuelle. Elles sont susceptibles d'évoluer. {COMPANY.name} ne saurait
          être tenue responsable des erreurs, omissions ou de l'indisponibilité d'un
          bien. Seul le mandat et l'acte authentique font foi.
        </p>
      </LegalSection>

      <LegalSection title="Article 6 — Liens hypertextes">
        <p>
          Le site peut contenir des liens vers des sites tiers sur lesquels{" "}
          {COMPANY.name} n'exerce aucun contrôle et décline toute responsabilité
          quant à leur contenu.
        </p>
      </LegalSection>

      <LegalSection title="Article 7 — Données personnelles">
        <p>
          Le traitement des données personnelles des utilisateurs est détaillé dans
          notre <a href="/confidentialite">politique de confidentialité</a>.
        </p>
      </LegalSection>

      <LegalSection title="Article 8 — Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, et à
          défaut de résolution amiable (voir le dispositif de médiation indiqué dans
          nos <a href="/mentions-legales">mentions légales</a>), les tribunaux
          français seront seuls compétents.
        </p>
      </LegalSection>

      <LegalSection title="Article 9 — Modification des CGU">
        <p>
          {COMPANY.name} se réserve le droit de modifier les présentes CGU à tout
          moment. La version applicable est celle en vigueur à la date de
          consultation du site.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
