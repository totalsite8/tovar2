export type RoutedMode = "product" | "tender";

export interface IntentResult {
  mode: RoutedMode;
  confidence: number;
  label: string;
}

const PRODUCT_RX =
  /(купить|заказать|дешевле|дешёвые|цена|наушники|наушник|айфон|iphone|airpods|кроссовки|кроссов|пылесос|телевизор|oled|ноутбук|телефон|планшет|buy|cheapest|sneakers|laptop|tv)/i;

const TENDER_RX =
  /(заменить|установить|установка|починить|отремонтировать|ремонт|окна|окно|кондиционер|электрик|сантехник|плитка|потолок|сделать|install|repair|replace|window|plumb)/i;

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
    return { mode: "product", confidence, label: "Агент Товаров" };
  }
  const confidence = Math.min(0.98, 0.74 + t * 0.02);
  return { mode: "tender", confidence, label: "Тендерный Агент" };
}

export const ROUTE_STEPS: Record<RoutedMode, string[]> = {
  product: [
    "Разбор намерения…",
    "Маршрут → Агент Товаров",
    "Торгуемся за кэшбек-маршруты…",
  ],
  tender: [
    "Разбор намерения…",
    "Маршрут → Тендерный Агент",
    "Составляем техзадание (ТЗ)…",
  ],
};

/** Сопоставляет запрос с конкретным товаром из каталога. */
export function matchProductId(query: string): string | undefined {
  const q = query.toLowerCase();
  const hints: [string, string[]][] = [
    ["airpods-pro-3", ["airpods", "аирподс", "наушник"]],
    ["asics-kayano-31", ["кроссов", "sneakers", "asics", "марафон"]],
    ["roborock-s8", ["пылесос", "vacuum", "roborock"]],
    ["lg-oled-c4", ["телевизор", "oled"]],
  ];
  for (const [id, kws] of hints) {
    if (kws.some((k) => q.includes(k))) return id;
  }
  return undefined;
}
