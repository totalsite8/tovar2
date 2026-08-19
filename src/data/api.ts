import productsJson from "../mock/products.json";
import tenderJson from "../mock/tender.json";
import feedJson from "../mock/orchestrator_feed.json";
import type { FeedScript, ProductPayload, TenderPayload } from "./types";

/** Mock network latency so TanStack Query loading states are honest. */
const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));

export async function fetchProduct(): Promise<ProductPayload> {
  await wait(750);
  return productsJson as unknown as ProductPayload;
}

export async function fetchTender(): Promise<TenderPayload> {
  await wait(600);
  return tenderJson as unknown as TenderPayload;
}

/** Feed script is local — the orchestrator "streams" it event by event. */
export function getFeedScript(): FeedScript {
  return feedJson as unknown as FeedScript;
}

export function newOrderId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `AUR-${new Date().getFullYear()}-${n}`;
}
