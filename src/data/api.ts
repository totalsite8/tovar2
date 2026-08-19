import productsJson from "../mock/products.json";
import tenderJson from "../mock/tender.json";
import feedJson from "../mock/orchestrator_feed.json";
import type { FeedScript, ProductPayload, TenderPayload } from "./types";

/** Мок-задержка сети, чтобы TanStack Query честно показывал загрузку. */
const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

const PRODUCTS = productsJson as unknown as ProductPayload[];

export async function fetchProducts(): Promise<ProductPayload[]> {
  await wait(700);
  return PRODUCTS;
}

export function getProductsSync(): ProductPayload[] {
  return PRODUCTS;
}

export async function fetchTender(): Promise<TenderPayload> {
  await wait(600);
  return tenderJson as unknown as TenderPayload;
}

/** Сценарий ленты локальный — оркестратор «стримит» его событие за событием. */
export function getFeedScript(): FeedScript {
  return feedJson as unknown as FeedScript;
}

export function newOrderId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `AUR-${new Date().getFullYear()}-${n}`;
}
