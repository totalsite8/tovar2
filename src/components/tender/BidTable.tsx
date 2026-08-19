import { AnimatePresence, motion } from "framer-motion";
import type { Bid, TenderPayload } from "../../data/types";
import { fmtRub } from "../../lib/format";
import { SectionLabel } from "../shared/Primitives";
import { IcAlert, IcSpark } from "../shared/icons";

function trustColor(t: number) {
  if (t >= 85) return "text-emerald-300";
  if (t >= 75) return "text-amber-300";
  return "text-red-400";
}

export function BidTable({
  tender,
  revealed,
}: {
  tender: TenderPayload;
  revealed: string[];
}) {
  const rows = tender.bids.filter((b) => revealed.includes(b.id));
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-800/70">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-700 px-5 py-3.5">
        <SectionLabel>apples-to-apples · normalized by ai</SectionLabel>
        <span className="font-mono text-[11px] text-ink-400">
          {rows.length}/{tender.bids.length} bids in
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-ink-700 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Base price</th>
              <th className="px-4 py-3 font-medium">Hidden fees</th>
              <th className="px-4 py-3 font-medium">Final price</th>
              <th className="px-5 py-3 font-medium">AI trust score</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((b) => {
                const pick = b.id === tender.ai_pick;
                return (
                  <motion.tr
                    key={b.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={`border-b border-ink-700/70 transition-colors last:border-0 ${
                      pick
                        ? "bg-violet-400/[0.07] shadow-[inset_3px_0_0_#a78bfa]"
                        : "hover:bg-ink-700/30"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-50">
                          {b.company}
                        </span>
                        {pick && (
                          <span className="inline-flex items-center gap-1 rounded border border-violet-400/40 bg-violet-400/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet-300">
                            <IcSpark /> ai pick
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 font-mono text-[10px] text-ink-500">
                        {b.kind} · via {b.source} · {b.response}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-ink-200">
                      {fmtRub(b.base)}
                    </td>
                    <td className="px-4 py-4">
                      {b.hidden.length === 0 ? (
                        <span className="rounded bg-emerald-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                          none · all-in
                        </span>
                      ) : (
                        <ul className="space-y-1">
                          {b.hidden.map((f) => (
                            <li
                              key={f.label}
                              className="flex items-center gap-1.5 font-mono text-[11px] text-red-400"
                            >
                              <IcAlert className="shrink-0" />
                              +{fmtRub(f.amount)} {f.label}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td
                      className={`px-4 py-4 font-mono text-base font-bold ${
                        pick ? "text-violet-300" : "text-ink-100"
                      }`}
                    >
                      {fmtRub(b.final)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`font-mono text-sm font-bold ${trustColor(b.trust)}`}>
                          {b.trust}
                        </span>
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-700">
                          <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: `${b.trust}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`block h-full rounded-full ${
                              b.trust >= 85
                                ? "bg-emerald-300"
                                : b.trust >= 75
                                  ? "bg-amber-300"
                                  : "bg-red-400"
                            }`}
                          />
                        </span>
                        <span className="font-mono text-[9px] uppercase tracking-wider text-ink-500">
                          {b.warranty} warranty
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 border-t border-ink-700 bg-ink-850/60 px-5 py-3">
        <IcSpark className="mt-0.5 shrink-0 text-violet-300" />
        <p className="text-[11.5px] leading-relaxed text-ink-300">
          <span className="font-semibold text-violet-300">Why this pick:</span>{" "}
          {tender.ai_pick_reason}
        </p>
      </div>
    </div>
  );
}
