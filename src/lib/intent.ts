export type RoutedMode = "product" | "tender";

export interface IntentResult {
  mode: RoutedMode;
  confidence: number;
  label: string;
}

const PRODUCT_RX =
  /(buy|order|cheapest|price of|best deal|airpods|iphone|headphones|earbuds|laptop|macbook|tv |oled|sneakers|watch|phone|tablet|gpu|console|купить|цена)/i;

const TENDER_RX =
  /(repair|install|replace|window|windows|plumb|electric|conditioner|\bac\b|renovate|mount|fix|cleaning|paint|tiling|ceiling|установ|окн|ремонт|замен)/i;

export function detectIntent(query: string): IntentResult | null {
  const q = query.trim();
  if (q.length < 3) return null;

  const pm = q.match(PRODUCT_RX);
  const tm = q.match(TENDER_RX);
  const p = pm ? pm[0].length : 0;
  const t = tm ? tm[0].length : 0;
  if (p === 0 && t === 0) return null;

  if (p >= t) {
    const confidence = Math.min(0.98, 0.72 + p * 0.02);
    return { mode: "product", confidence, label: "Product Agent" };
  }
  const confidence = Math.min(0.98, 0.74 + t * 0.02);
  return { mode: "tender", confidence, label: "Tender Agent" };
}

export const ROUTE_STEPS: Record<RoutedMode, string[]> = {
  product: [
    "Parsing intent…",
    "Routing → Product Agent",
    "Negotiating cashback routes…",
  ],
  tender: [
    "Parsing intent…",
    "Routing → Tender Agent",
    "Drafting technical spec (ТЗ)…",
  ],
};
