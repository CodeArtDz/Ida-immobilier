import { useEffect } from "react";

const SLOT_ID = "page-json-ld";

export function useJsonLd(data: Record<string, unknown> | null | undefined) {
  useEffect(() => {
    document.getElementById(SLOT_ID)?.remove();
    if (!data) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = SLOT_ID;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.getElementById(SLOT_ID)?.remove();
    };
  }, [JSON.stringify(data)]);
}
