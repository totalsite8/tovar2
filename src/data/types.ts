/* ---------- shared agent taxonomy ---------- */
export type AgentId =
  | "orchestrator"
  | "product"
  | "tender"
  | "scout"
  | "voice"
  | "negotiator";

export type AgentColor = "cyan" | "violet" | "amber" | "slate";

/* ---------- product agent ---------- */
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

export interface ProductPayload {
  id: string;
  name: string;
  category: string;
  image: string;
  query: string;
  marketplaces_scanned: number;
  market_cheapest: RetailerOption;
  partner: PartnerOption;
  savings_vs_market: number;
  price_index_90d: number[];
  cashback_source: string;
  trust_ledger: LedgerRow[];
}

/* ---------- tender agent ---------- */
export interface HiddenFee {
  label: string;
  amount: number;
}

export interface Bid {
  id: string;
  company: string;
  kind: "LLC" | "private master";
  response: string;
  warranty: string;
  base: number;
  hidden: HiddenFee[];
  final: number;
  trust: number;
  source: "partner db" | "2GIS" | "Yandex Maps";
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

/* ---------- orchestrator feed ---------- */
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
  t: number; // ms since session start
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
