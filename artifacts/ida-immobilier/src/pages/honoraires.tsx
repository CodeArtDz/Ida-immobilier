import { useSeo } from "@/hooks/use-seo";
import { LegalPage, LegalSection } from "@/components/legal-page";
import {
  COMPANY,
  TRANSACTION_FEES,
  RENTAL_FEES,
  MANAGEMENT_FEES,
} from "@/data/legal";

export default function Honoraires() {
  useSeo({
    title: "Barème des honoraires",
    description:
      "Barème des honoraires TTC de I.D.A Immobilier : honoraires de transaction (vente), honoraires de location plafonnés (loi ALUR) et frais de gestion locative.",
    canonical: COMPANY.website + "/honoraires",
    noIndex: true,
  });

  return (
    <LegalPage
      eyebrow="Tarifs"
      title="Barème des honoraires"
      intro="Affichage conforme à l'arrêté du 10 janvier 2017 relatif à l'information des consommateurs par les professionnels intervenant dans les transactions immobilières. Tous les montants sont indiqués TTC (TVA au taux de 20 %)."
    >
      <LegalSection title="Honoraires de transaction (vente)">
        <p>
          Sauf stipulation contraire au mandat, les honoraires de négociation sont à
          la charge de l'acquéreur. Ils sont calculés sur le prix de vente net
          vendeur, selon le barème dégressif suivant :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">
                  Tranche de prix de vente
                </th>
                <th className="text-left font-semibold px-4 py-3">
                  Honoraires TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {TRANSACTION_FEES.map((row, i) => (
                <tr
                  key={row.tranche}
                  className={i % 2 === 0 ? "bg-background" : "bg-accent/5"}
                >
                  <td className="px-4 py-3 border-t border-border text-foreground">
                    {row.tranche}
                  </td>
                  <td className="px-4 py-3 border-t border-border text-foreground font-medium">
                    {row.fee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm">
          Les honoraires ne sont dus qu'en cas de réalisation effective de la vente.
        </p>
      </LegalSection>

      <LegalSection title="Honoraires de location">
        <p>
          Conformément à la loi n° 89-462 du 6 juillet 1989 modifiée par la loi ALUR
          et au décret n° 2014-890, les honoraires à la charge du locataire sont
          plafonnés. Marignane étant située en zone tendue, les plafonds applicables
          sont les suivants :
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Prestation</th>
                <th className="text-left font-semibold px-4 py-3">
                  Honoraires TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {RENTAL_FEES.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? "bg-background" : "bg-accent/5"}
                >
                  <td className="px-4 py-3 border-t border-border">
                    <span className="block text-foreground font-medium">
                      {row.label}
                    </span>
                    <span className="block text-muted-foreground text-xs mt-0.5">
                      {row.detail}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-border text-foreground font-medium">
                    {row.fee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm">
          La part des honoraires à la charge du locataire ne peut excéder celle du
          bailleur ni les plafonds légaux par mètre carré de surface habitable.
        </p>
      </LegalSection>

      <LegalSection title="Gestion locative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Prestation</th>
                <th className="text-left font-semibold px-4 py-3">
                  Honoraires TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {MANAGEMENT_FEES.map((row, i) => (
                <tr
                  key={row.label}
                  className={i % 2 === 0 ? "bg-background" : "bg-accent/5"}
                >
                  <td className="px-4 py-3 border-t border-border text-foreground">
                    {row.label}
                  </td>
                  <td className="px-4 py-3 border-t border-border text-foreground font-medium">
                    {row.fee}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="Estimation">
        <p>
          L'estimation de votre bien réalisée par nos conseillers est{" "}
          <strong>gratuite et sans engagement</strong>. Pour toute demande,
          contactez-nous au{" "}
          <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phoneDisplay}</a> ou par
          email à <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
