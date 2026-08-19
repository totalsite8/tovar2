/* ---------- таксономия агентов ---------- */
export type AgentId =
  | "orchestrator"
  | "product"
  | "tender"
  | "scout"
  | "voice"
  | "negotiator";

/* ---------- агент товаров ---------- */
export type ProductLayout = "audio" | "sneakers" | "appliance" | "tv";

export interface RetailerOption {
  retailer: string;
  price: number;
  delivery: string;
  warranty: string;
  returns: string;
}

export interface PartnerOption extends RetailerOption {
  cashback_rate: number;
  cashback: number;
  final: number;
}

export interface LedgerRow {
  label: string;
  value: string;
  tone: "good" | "bad" | "neutral";
}

export interface ProductExtras {
  sizes?: string[];
  out?: string[];
  colors?: { name: string; hex: string }[];
  specs?: [string, string][];
  alt_offers?: { retailer: string; price: number; note: string }[];
  meter?: number;
  verdict?: string;
  weeks_down?: number;
}

export interface ProductPayload {
  id: string;
  name: string;
  category: string;
  layout: ProductLayout;
  image: string;
  keywords: string[];
  marketplaces_scanned: number;
  market_cheapest: RetailerOption;
  partner: PartnerOption;
  savings_vs_market: number;
  price_index_90d: number[];
  cashback_source: string;
  trust_ledger: LedgerRow[];
  extras?: ProductExtras;
}

/* ---------- тендерный агент ---------- */
export interface HiddenFee {
  label: string;
  amount: number;
}

export interface Bid {
  id: string;
  company: string;
  kind: "ООО" | "частный мастер";
  response: string;
  warranty: string;
  base: number;
  hidden: HiddenFee[];
  final: number;
  trust: number;
  source: string;
  phone: string;
}

export interface TenderPayload {
  task_id: string;
  title: string;
  district: string;
  photo: string;
  spec: string[];
  constraints: string[];
  bids: Bid[];
  ai_pick: string;
  ai_pick_reason: string;
  escrow: {
    freeze_note: string;
    milestones: string[];
    fee_pct: number;
  };
  smartlink: {
    url: string;
    open_rate: string;
    median_response: string;
  };
}

/* ---------- лента оркестратора ---------- */
export type FeedKind =
  | "route"
  | "spec"
  | "check"
  | "escalate"
  | "scout"
  | "voice"
  | "whatsapp"
  | "open"
  | "bid"
  | "analyze"
  | "ready";

export interface FeedEvent {
  id: string;
  t: number;
  agent: AgentId;
  kind: FeedKind;
  text: string;
  detail?: string;
  bidId?: string;
}

export interface FeedScript {
  session: string;
  events: FeedEvent[];
}
