import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FeedEvent } from "../../data/types";
import { fmtT } from "../../lib/format";
import { AgentBadge, LiveDot, SectionLabel } from "../shared/Primitives";

const KIND_GLOW: Partial<Record<FeedEvent["kind"], string>> = {
  escalate: "border-l-amber-400",
  bid: "border-l-violet-400",
  ready: "border-l-violet-300",
  voice: "border-l-amber-400/60",
  whatsapp: "border-l-amber-400/60",
  scout: "border-l-amber-400/40",
};

export function ActivityFeed({ events, total }: { events: FeedEvent[]; total: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-ink-700 bg-ink-800/70">
      <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <SectionLabel>live activity</SectionLabel>
          <LiveDot />
        </div>
        <span className="font-mono text-[11px] text-ink-400">
          {events.length}/{total} events ·{" "}
          <span className="text-violet-300">
            t{events.length ? fmtT(events[events.length - 1].t) : "+0.0s"}
          </span>
        </span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-3">
        {events.length === 0 && (
          <p className="p-4 font-mono text-xs text-ink-500">
            awaiting orchestrator…
          </p>
        )}
        <AnimatePresence initial={false}>
          {events.map((ev, i) => {
            const latest = i === events.length - 1;
            return (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`mb-2 rounded-lg border border-transparent border-l-2 bg-ink-850/80 px-3.5 py-2.5 transition-colors duration-500 ${
                  KIND_GLOW[ev.kind] ?? "border-l-ink-600"
                } ${latest ? "border-ink-600" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-ink-500">
                    {fmtT(ev.t)}
                  </span>
                  <AgentBadge agent={ev.agent} size="sm" />
                </div>
                <p
                  className={`mt-1.5 text-[13px] leading-snug ${
                    latest ? "text-ink-50" : "text-ink-200"
                  }`}
                >
                  {ev.text}
                </p>
                {ev.detail && (
                  <p className="mt-1 font-mono text-[10.5px] leading-relaxed text-ink-400">
                    {ev.detail}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
