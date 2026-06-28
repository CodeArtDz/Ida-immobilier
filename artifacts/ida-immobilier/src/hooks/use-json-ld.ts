import { useEffect } from "react";

const SLOT_ID = "page-json-ld";
const ATTR = "data-json-ld";

type Ld = Record<string, unknown>;

// Injects one or more JSON-LD blocks into <head>. Accepts a single object, an
// array of objects, or null/undefined (clears all). The first block keeps the
// legacy `#page-json-ld` id so the prerender script's single-slot replacement
// keeps working; additional blocks are tagged with `data-json-ld`.
export function useJsonLd(data: Ld | Array<Ld | null | undefined> | null | undefined) {
  const blocks = (Array.isArray(data) ? data : [data]).filter(
    (b): b is Ld => b != null,
  );
  const serialized = JSON.stringify(blocks);

  useEffect(() => {
    document.getElementById(SLOT_ID)?.remove();
    document.querySelectorAll(`script[${ATTR}]`).forEach((el) => el.remove());

    blocks.forEach((block, i) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      if (i === 0) script.id = SLOT_ID;
      script.setAttribute(ATTR, String(i));
      script.textContent = JSON.stringify(block);
      document.head.appendChild(script);
    });

    return () => {
      document.getElementById(SLOT_ID)?.remove();
      document.querySelectorAll(`script[${ATTR}]`).forEach((el) => el.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized]);
}
