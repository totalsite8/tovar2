import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct, newOrderId } from "../../data/api";
import { useAuraStore } from "../../store/useAuraStore";
import { fmtRub, pct } from "../../lib/format";
import {
  AgentBadge,
  LiveDot,
  Money,
  MediaImg,
  Panel,
  SectionLabel,
} from "../shared/Primitives";
import {
  IcArrow,
  IcCheck,
  IcShield,
  IcTag,
  IcWallet,
  IcX,
} from "../shared/icons";

const STEPS = [
  "Intent parsed · category locked: Audio / TWS",
  "Scanning 14 marketplaces & price indexes…",
  "Cashback routes calculated · 3 CPA offers",
  "Honest ranking ready · floor vs partner",
];

function Sparkline({ data, active }: { data: number[]; active: boolean }) {
  const w = 320;
  const h = 96;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - 10 - ((v - min) / (max - min)) * (h - 24);
    return [x, y] as const;
  });
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <defs>
        <linearGradient id="sp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${d} L${w},${h} L0,${h} Z`}
        fill="url(#sp)"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="#67e8f9"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r="4"
        fill="#67e8f9"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ delay: 1.2 }}
      />
    </svg>
  );
}

export function ProductRoom() {
  const { data, isLoading } = useQuery({
    queryKey: ["product"],
    queryFn: fetchProduct,
  });
  const query = useAuraStore((s) => s.query);
  const pushToast = useAuraStore((s) => s.pushToast);

  const [step, setStep] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    setStep(0);
    const id = window.setInterval(
      () => setStep((s) => (s < STEPS.length ? s + 1 : s)),
      620
    );
    return () => clearInterval(id);
  }, [isLoading]);

  const ready = !isLoading && data && step >= STEPS.length;

  function claim() {
    if (!data || claiming) return;
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setClaimed(newOrderId());
      pushToast(`Cashback ${fmtRub(data.partner.cashback)} locked to wallet`, "cyan");
    }, 1100);
  }

  if (isLoading || !data) {
    return (
      <div data-accent="cyan">
        <RoomHeader query={query} />
        <div className="mt-6 grid gap-4 lg:grid-cols-12">
          {["lg:col-span-5", "lg:col-span-7"].map((c) => (
            <Panel key={c} className={`h-72 p-6 ${c}`}>
              <div
                className="shimmer-bar h-4 w-40 rounded"
                style={{ ["--acc-rgb" as string]: "103 232 249" }}
              />
              <div className="mt-6 space-y-3">
                {[100, 88, 72, 90, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded bg-ink-700"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </Panel>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 font-mono text-xs text-cyan-300">
          <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-cyan-300" />
          product agent negotiating cashback routes…
        </p>
      </div>
    );
  }

  const p = data.partner;
  const m = data.market_cheapest;

  return (
    <div data-accent="cyan">
      <RoomHeader query={query} />

      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        {/* ---------- left rail: agent work ---------- */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>agent trace</SectionLabel>
              <LiveDot />
            </div>
            <ul className="mt-4 space-y-3">
              {STEPS.map((s, i) => {
                const done = step > i;
                const current = step === i;
                return (
                  <li key={s} className="flex items-start gap-3 text-[13px]">
                    <span
                      className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border text-[9px] transition-all duration-300 ${
                        done
                          ? "border-cyan-300 bg-cyan-400/20 text-cyan-300"
                          : current
                            ? "border-cyan-400/50 text-cyan-300"
                            : "border-ink-600 text-ink-500"
                      }`}
                    >
                      {done ? <IcCheck /> : current ? <span className="dot-live inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" /> : i + 1}
                    </span>
                    <span
                      className={`transition-colors duration-300 ${
                        done ? "text-ink-100" : current ? "text-cyan-200" : "text-ink-500"
                      }`}
                    >
                      {s}
                      {current && <span className="caret ml-1 inline-block h-3 w-[6px] translate-y-0.5 bg-cyan-300" />}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className="p-5">
            <SectionLabel>price index · 90 days</SectionLabel>
            <div className="mt-3">
              <Sparkline data={data.price_index_90d} active={!!ready} />
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-ink-400">
              <span>−90d</span>
              <span className="text-cyan-300">floor {fmtRub(Math.min(...data.price_index_90d))}</span>
              <span>today</span>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionLabel>trust ledger</SectionLabel>
            <ul className="mt-3 divide-y divide-ink-700">
              {data.trust_ledger.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                  <span className="text-ink-300">{row.label}</span>
                  <span
                    className={`text-right font-mono ${
                      row.tone === "good"
                        ? "text-cyan-300"
                        : row.tone === "bad"
                          ? "text-red-400"
                          : "text-ink-200"
                    }`}
                  >
                    {row.value}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-ink-700 pt-3 font-mono text-[10px] text-ink-500">
              {data.cashback_source}
            </p>
          </Panel>
        </div>

        {/* ---------- honest choice card ---------- */}
        <div className="lg:col-span-7">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <AgentBadge agent="product" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
                  honest choice
                </span>
              </div>
              <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                cashback routed
              </span>
            </div>

            <div className="grid sm:grid-cols-[200px_1fr]">
              <MediaImg
                src={data.image}
                alt={data.name}
                icon={<IcTag />}
                className="h-44 w-full object-cover sm:h-full"
              />
              <div className="p-5">
                <h2 className="text-2xl font-semibold tracking-tight text-ink-50">
                  {data.name}
                </h2>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
                  {data.category} · {data.marketplaces_scanned} sources scanned
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-ink-300">
                  The cheapest raw price is a marketplace import with seller-only
                  warranty. The partner route costs more on paper — and less in
                  reality, once cashback lands in your wallet.
                </p>
              </div>
            </div>

            {/* A vs B */}
            <div className="grid gap-4 p-5 pt-0 sm:grid-cols-2">
              {/* option A */}
              <div className="rounded-lg border border-ink-700 bg-ink-850/60 p-4 opacity-75">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                    option A · market floor
                  </span>
                  <span className="rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-400">
                    raw cheapest
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink-200">{m.retailer}</p>
                <p className="mt-1 font-mono text-2xl text-ink-200 line-through decoration-ink-500/60 decoration-2">
                  {fmtRub(m.price)}
                </p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-ink-400">
                  <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400/80" />{m.delivery}</li>
                  <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400/80" />{m.warranty}</li>
                  <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400/80" />{m.returns}</li>
                </ul>
              </div>

              {/* option B */}
              <div className="relative rounded-lg border border-cyan-400/40 bg-cyan-400/[0.06] p-4 shadow-[0_0_40px_-14px_rgba(103,232,249,0.5)]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                    option B · aura pick
                  </span>
                  <span className="rounded border border-cyan-400/40 bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-cyan-200">
                    −{fmtRub(data.savings_vs_market)} vs floor
                  </span>
                </div>
                <p className="mt-3 text-sm text-ink-100">{p.retailer}</p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-ink-300">
                  <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-cyan-300" />{p.delivery}</li>
                  <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-cyan-300" />{p.warranty}</li>
                  <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-cyan-300" />{p.returns}</li>
                </ul>
              </div>
            </div>

            {/* the math */}
            <div className="mx-5 mb-5 rounded-lg border border-ink-700 bg-ink-950/60 p-5">
              <SectionLabel>the math, shown</SectionLabel>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono">
                <span className="text-lg text-ink-200">
                  <Money value={p.price} active={!!ready} />
                </span>
                <span className="text-ink-500">−</span>
                <span className="text-lg text-cyan-300">
                  <Money value={p.cashback} active={!!ready} duration={1100} />
                </span>
                <span className="text-ink-500">=</span>
                <span className="text-3xl font-bold text-ink-50">
                  <Money value={p.final} active={!!ready} duration={1300} />
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded bg-cyan-400/15 px-2 py-1 font-mono text-cyan-200">
                  {pct(p.cashback_rate)} instant cashback
                </span>
                <span className="text-ink-400">
                  beats the market floor by{" "}
                  <span className="font-mono text-cyan-300">{fmtRub(data.savings_vs_market)}</span>{" "}
                  — with official warranty.
                </span>
              </div>
            </div>

            {/* actions / success */}
            <div className="border-t border-ink-700 px-5 py-4">
              <AnimatePresence mode="wait">
                {claimed ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center gap-4"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-400/15 text-lg text-cyan-300">
                      <IcCheck />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-50">
                        Order <span className="font-mono text-cyan-300">{claimed}</span> created
                      </p>
                      <p className="mt-0.5 text-xs text-ink-300">
                        {fmtRub(p.cashback)} reserved in Aura Wallet · delivery {p.delivery.toLowerCase()}
                      </p>
                    </div>
                    <span className="ml-auto inline-flex items-center gap-2 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] text-ink-300">
                      <IcShield className="text-cyan-300" /> serial check queued
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cta"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    <button
                      onClick={claim}
                      disabled={claiming}
                      className="group inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-ink-950 transition-all duration-200 hover:bg-cyan-200 hover:shadow-[0_0_30px_-6px_rgba(103,232,249,0.8)] active:scale-[0.98] disabled:opacity-70"
                    >
                      {claiming ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                          Securing route…
                        </>
                      ) : (
                        <>
                          <IcWallet /> Claim Cashback & Buy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        pushToast("Opening marketplace checkout — no cashback applied", "slate")
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-600 px-5 py-3 text-sm text-ink-300 transition-all duration-200 hover:border-ink-400 hover:text-ink-100"
                    >
                      Buy without cashback <IcArrow className="text-ink-500 transition-transform group-hover:translate-x-0.5" />
                    </button>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:ml-auto">
                      payout · instant
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function RoomHeader({ query }: { query: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <SectionLabel>session 0426 / product-agent</SectionLabel>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
          The Honest Choice
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-300">
          Intent: <span className="font-mono text-cyan-200">“{query || "cheapest AirPods Pro 3"}”</span>
        </p>
      </div>
      <AgentBadge agent="product" />
    </div>
  );
}
