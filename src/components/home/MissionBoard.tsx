import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuraStore } from "../../store/useAuraStore";
import {
  AgentBadge,
  LiveDot,
  Panel,
  Reveal,
  SectionLabel,
  Stat,
} from "../shared/Primitives";
import { IcArrow, IcBolt, IcShield, IcWallet } from "../shared/icons";

const WIRE: { agent: "scout" | "voice" | "product" | "tender"; text: string }[] =
  [
    { agent: "scout", text: "mapped 12 new window contractors in Akademichesky" },
    { agent: "voice", text: "qualified an AC-install crew on a 51s call" },
    { agent: "product", text: "cashback route #A-114 paid out 2,584 ₽" },
    { agent: "tender", text: "spec #2041 accepted by contractor, no edits" },
    { agent: "scout", text: "Smart-Link opened by OknaStroy · 12s on page" },
    { agent: "tender", text: "escrow released · job #1987 accepted by user" },
  ];

const LEDGER = [
  {
    n: "01",
    title: "Cold start, solved",
    body: "No contractors in the DB? The AI Army scrapes 2GIS & Yandex Maps, calls crews with Voice AI and collects bids over WhatsApp — zero registration on their side.",
    icon: <IcBolt />,
    tint: "text-amber-300",
  },
  {
    n: "02",
    title: "Trust, engineered",
    body: "Every bid is normalized to apples-to-apples: hidden fees exposed, warranty weighted, disputes checked. Money sits in escrow until you sign acceptance.",
    icon: <IcShield />,
    tint: "text-violet-300",
  },
  {
    n: "03",
    title: "Honest math",
    body: "The Product Agent shows the raw market floor — then beats it. Partner price minus Aura cashback, computed live, lands below the cheapest listing.",
    icon: <IcWallet />,
    tint: "text-cyan-300",
  },
];

export function MissionBoard() {
  const queueIntent = useAuraStore((s) => s.queueIntent);
  const [wire, setWire] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setWire((w) => (w + 1) % WIRE.length),
      2600
    );
    return () => clearInterval(id);
  }, []);

  const line = WIRE[wire];

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ---- left: statement ---- */}
      <div className="flex flex-col justify-between gap-10 lg:col-span-7">
        <div>
          <Reveal>
            <SectionLabel>session 0426 · orchestrator online</SectionLabel>
          </Reveal>
          <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] font-semibold tracking-tight text-ink-50">
            {["Three agents.", "One honest", "answer."].map((l, i) => (
              <span key={l} className="block overflow-hidden">
                <motion.span
                  className="block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{
                    delay: 0.15 + i * 0.12,
                    duration: 0.7,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {i === 1 ? (
                    <>
                      One <span className="text-cyan-300">honest</span>
                    </>
                  ) : (
                    l
                  )}
                </motion.span>
              </span>
            ))}
          </h1>
          <Reveal i={3}>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-300">
              Aura routes a single sentence to specialized agents that buy,
              negotiate and verify on your behalf — and shows its work in real
              time, so trust is earned on-screen, not asked for.
            </p>
          </Reveal>
        </div>

        <Reveal i={4}>
          <div className="grid grid-cols-2 gap-6 border-t border-ink-700 pt-6 sm:grid-cols-4">
            <Stat value="3/3" label="agents online" accent />
            <Stat value="11.2%" label="median savings" />
            <Stat value="3m 40s" label="time to first bid" />
            <Stat value="4.2M ₽" label="in escrow now" />
          </div>
        </Reveal>
      </div>

      {/* ---- right: agent channels ---- */}
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Reveal i={2}>
          <Panel hover className="group relative overflow-hidden p-5">
            <div className="absolute inset-y-0 left-0 w-[3px] bg-cyan-400/70" />
            <div className="flex items-center justify-between">
              <AgentBadge agent="product" />
              <LiveDot className="text-cyan-300" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-50">
              The Honest Choice
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
              Market floor vs partner + cashback — the math always shown,
              never hidden.
            </p>
            <button
              onClick={() =>
                queueIntent("cheapest AirPods Pro 3 with real warranty")
              }
              className="mt-4 inline-flex w-full items-center justify-between rounded-lg border border-cyan-400/25 bg-cyan-400/5 px-3.5 py-2.5 text-left text-[13px] text-cyan-100 transition-all duration-200 hover:border-cyan-300/60 hover:bg-cyan-400/10 group-hover:translate-x-0 hover:translate-x-1"
            >
              <span className="font-mono">cheapest AirPods Pro 3…</span>
              <IcArrow className="text-cyan-300" />
            </button>
          </Panel>
        </Reveal>

        <Reveal i={3}>
          <Panel hover className="group relative overflow-hidden p-5">
            <div className="absolute inset-y-0 left-0 w-[3px] bg-violet-400/70" />
            <div className="flex items-center justify-between">
              <AgentBadge agent="tender" />
              <LiveDot className="text-violet-300" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-50">
              The Service Solver
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
              One message becomes a ТЗ, a live tender and ranked bids — with
              the AI Army on cold start.
            </p>
            <button
              onClick={() => queueIntent("replace 3 windows, turnkey")}
              className="mt-4 inline-flex w-full items-center justify-between rounded-lg border border-violet-400/25 bg-violet-400/5 px-3.5 py-2.5 text-left text-[13px] text-violet-100 transition-all duration-200 hover:border-violet-300/60 hover:bg-violet-400/10 hover:translate-x-1"
            >
              <span className="font-mono">replace 3 windows, turnkey</span>
              <IcArrow className="text-violet-300" />
            </button>
          </Panel>
        </Reveal>

        {/* orchestrator wire */}
        <Reveal i={4}>
          <Panel className="flex items-center gap-3 px-4 py-3">
            <span className="shrink-0 text-amber-300">
              <IcBolt />
            </span>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
              wire
            </span>
            <div className="relative h-5 flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.span
                  key={wire}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 truncate font-mono text-xs text-ink-200"
                >
                  <span
                    className={
                      line.agent === "product"
                        ? "text-cyan-300"
                        : line.agent === "tender"
                          ? "text-violet-300"
                          : "text-amber-300"
                    }
                  >
                    {line.agent}
                  </span>{" "}
                  {line.text}
                </motion.span>
              </AnimatePresence>
            </div>
          </Panel>
        </Reveal>
      </div>

      {/* ---- ledger: how it wins ---- */}
      <Reveal className="lg:col-span-12">
        <div className="mt-2">
          <SectionLabel className="mb-4">why agents win</SectionLabel>
          <div className="grid gap-px overflow-hidden rounded-xl border border-ink-700 bg-ink-700 md:grid-cols-3">
            {LEDGER.map((row) => (
              <div
                key={row.n}
                className="group bg-ink-850 p-6 transition-colors duration-300 hover:bg-ink-800"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xs text-ink-500">
                    {row.n}
                  </span>
                  <span
                    className={`text-xl opacity-70 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100 ${row.tint}`}
                  >
                    {row.icon}
                  </span>
                </div>
                <h4 className="mt-3 text-base font-semibold text-ink-50">
                  {row.title}
                </h4>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-300">
                  {row.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
