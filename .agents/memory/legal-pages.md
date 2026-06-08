---
name: French legal pages
description: How the legal/info pages (mentions légales, confidentialité, CGU, honoraires) are built and why placeholders exist
---

# French legal pages

Footer links `/mentions-legales`, `/confidentialite`, `/cgu`, `/honoraires` are real pages built per French law (LCEN art.6, RGPD, loi Hoguet, loi ALUR, arrêté 10 jan 2017). Shared company/barème data lives in `src/data/legal.ts`; shared layout in `src/components/legal-page.tsx`.

**Rule:** Never fabricate agency-specific legal identifiers (SIRET, RCS, n° carte professionnelle, garant financier, RCP, médiateur, capital, forme juridique, directeur de publication). They are marked with the `TODO = "[à compléter]"` constant for the owner to fill in.

**Why:** Inventing registration numbers is misleading and legally risky; only the business holds these values.

**How to apply:** When the user provides real figures, replace the `TODO` values in `src/data/legal.ts` only — pages read from there. Barème amounts (transaction %, gestion %) are indicative example values; location caps (10 €/m² + 3 €/m², zone tendue Marignane) are legal maximums.
