import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchTender, getFeedScript, newOrderId } from "../../data/api";
import type { FeedKind } from "../../data/types";
import { useAuraStore } from "../../store/useAuraStore";
import { fmtRub } from "../../lib/format";
import { ActivityFeed } from "./ActivityFeed";
import { SmartLink } from "./SmartLink";
import { BidTable } from "./BidTable";
import {
  AgentBadge,
  LiveDot,
  Panel,
  SectionLabel,
} from "../shared/Primitives";
import {
  IcChat,
  IcCheck,
  IcCopy,
  IcDoc,
  IcFwd,
  IcPhone,
  IcRadar,
  IcReplay,
  IcShield,
  IcX,
} from "../shared/icons";

type Phase = "spec" | "army" | "bids" | "decision";

const PHASE_CHIP: Record<Phase, { label: string; cls: string; live: boolean }> = {
  spec: {
    label: "пишем ТЗ",
    cls: "border-violet-400/40 bg-violet-400/10 text-violet-300",
    live: true,
  },
  army: {
    label: "ИИ-армия в деле",
    cls: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    live: true,
  },
  bids: {
    label: "живые торги",
    cls: "border-violet-400/40 bg-violet-400/10 text-violet-300",
    live: true,
  },
  decision: {
    label: "готово к эскроу",
    cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    live: false,
  },
};

export function TenderRoom() {
  const { data: tender, isLoading } = useQuery({
    queryKey: ["tender"],
    queryFn: fetchTender,
  });
  const query = useAuraStore((s) => s.query);
  const sessionSeed = useAuraStore((s) => s.sessionSeed);
  const replaySession = useAuraStore((s) => s.replaySession);
  const patchActive = useAuraStore((s) => s.patchActive);
  const pushToast = useAuraStore((s) => s.pushToast);

  const script = useMemo(() => getFeedScript(), []);
  const [cursor, setCursor] = useState(0);
  const [escrowOpen, setEscrowOpen] = useState(false);
  const [secured, setSecured] = useState<string | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);

  useEffect(() => {
    setCursor(0);
    setSecured(null);
    setContactsOpen(false);
    setEscrowOpen(false);
  }, [sessionSeed]);

  /* движок проигрывания — идёт по таймкодам сценария ленты */
  useEffect(() => {
    if (isLoading || cursor >= script.events.length) return;
    const prev = cursor === 0 ? 0 : script.events[cursor - 1].t;
    const delay = Math.max(140, script.events[cursor].t - prev);
    const id = window.setTimeout(() => setCursor((c) => c + 1), delay);
    return () => clearTimeout(id);
  }, [cursor, isLoading, script]);

  const visible = script.events.slice(0, cursor);
  const has = (k: FeedKind) => visible.some((e) => e.kind === k);
  const done = !isLoading && cursor >= script.events.length;

  const phase: Phase = has("ready")
    ? "decision"
    : has("bid")
      ? "bids"
      : has("escalate")
        ? "army"
        : "spec";

  const revealedBids = visible
    .filter((e) => e.kind === "bid" && e.bidId)
    .map((e) => e.bidId!);
  const specLines = tender
    ? phase === "spec" && !has("check")
      ? 2
      : tender.spec.length
    : 0;
  const smartLinkSeen = has("whatsapp") || has("open") || has("bid");
  const chip = PHASE_CHIP[phase];
  const pick = tender?.bids.find((b) => b.id === tender.ai_pick);

  function copy(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    pushToast("Скопировано в буфер обмена", "violet");
  }

  if (isLoading || !tender) {
    return (
      <div data-accent="violet">
        <Header query={query} chip={PHASE_CHIP.spec} done={false} />
        <div className="mt-6 grid gap-5 lg:grid-cols-12">
          <Panel className="h-[440px] p-6 lg:col-span-7">
            <div className="shimmer-bar h-4 w-44 rounded" style={{ ["--acc-rgb" as string]: "167 139 250" }} />
            <div className="mt-6 space-y-3">
              {[96, 80, 88, 64, 92, 70].map((w, i) => (
                <div key={i} className="h-3 rounded bg-ink-700" style={{ width: `${w}%` }} />
              ))}
            </div>
          </Panel>
          <Panel className="h-[440px] p-6 lg:col-span-5">
            <div className="shimmer-bar h-4 w-32 rounded" style={{ ["--acc-rgb" as string]: "167 139 250" }} />
            <div className="mt-6 space-y-3">
              {[100, 74, 86, 58].map((w, i) => (
                <div key={i} className="h-3 rounded bg-ink-700" style={{ width: `${w}%` }} />
              ))}
            </div>
          </Panel>
        </div>
        <p className="mt-6 flex items-center gap-2 font-mono text-xs text-violet-300">
          <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-violet-300" />
          тендерный агент составляет техзадание…
        </p>
      </div>
    );
  }

  return (
    <div data-accent={phase === "army" ? "amber" : "violet"}>
      <Header query={query} chip={chip} done={done} />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!done && (
          <button
            onClick={() => setCursor(script.events.length)}
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-300 transition-all hover:border-violet-400/50 hover:text-violet-300"
          >
            <IcFwd /> ускорить
          </button>
        )}
        <button
          onClick={() => replaySession()}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-300 transition-all hover:border-violet-400/50 hover:text-violet-300"
        >
          <IcReplay /> повторить сессию
        </button>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
          задача #{tender.task_id} · {tender.district}
        </span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-12">
        {/* ---- слева: живая лента + смарт-ссылка ---- */}
        <div className="flex min-h-0 flex-col gap-5 lg:col-span-7">
          <div className="h-[440px]">
            <ActivityFeed events={visible} total={script.events.length} />
          </div>
          <AnimatePresence>
            {smartLinkSeen && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <SmartLink tender={tender} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ---- справа: ТЗ + ИИ-армия ---- */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>техзадание · ТЗ</SectionLabel>
              <span className="text-violet-300">
                <IcDoc />
              </span>
            </div>
            <ul className="mt-4 space-y-2.5">
              {tender.spec.slice(0, specLines).map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-200"
                >
                  <span className="mt-0.5 font-mono text-[10px] text-violet-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {line}
                </motion.li>
              ))}
              {specLines < tender.spec.length && (
                <li className="flex items-center gap-2 font-mono text-[11px] text-violet-300">
                  <span className="caret inline-block h-3 w-[6px] bg-violet-300" />
                  извлекаем…
                </li>
              )}
            </ul>
            {specLines >= tender.spec.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 border-t border-ink-700 pt-3"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                  жёсткие условия
                </p>
                <ul className="mt-2 space-y-1.5">
                  {tender.constraints.map((c) => (
                    <li key={c} className="flex gap-2 text-[11.5px] text-ink-300">
                      <IcCheck className="mt-0.5 shrink-0 text-violet-300" />
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>ИИ-армия · протокол холодного старта</SectionLabel>
              <span
                className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                  phase === "army"
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                    : has("escalate")
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-ink-600 text-ink-500"
                }`}
              >
                {phase === "army" ? "в работе" : has("escalate") ? "готово" : "ожидание"}
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {(
                [
                  {
                    id: "разведчик",
                    icon: <IcRadar />,
                    desc: "сканирует 2ГИС + Яндекс Карты",
                    on: has("escalate"),
                    active: phase === "army" && !has("whatsapp"),
                  },
                  {
                    id: "голосовой ИИ",
                    icon: <IcPhone />,
                    desc: "звонит подрядчикам, проверяет мощности",
                    on: has("voice"),
                    active: has("voice") && !has("whatsapp"),
                  },
                  {
                    id: "переговорщик",
                    icon: <IcChat />,
                    desc: "рассылает ТЗ по WhatsApp Smart-Link",
                    on: has("whatsapp"),
                    active: has("whatsapp") && !done,
                  },
                ] as const
              ).map((a) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-500 ${
                    a.active
                      ? "border-amber-400/40 bg-amber-400/[0.06]"
                      : "border-ink-700 bg-ink-850/60"
                  }`}
                >
                  <span
                    className={`text-base transition-colors duration-500 ${
                      a.active ? "text-amber-300" : a.on ? "text-ink-200" : "text-ink-500"
                    }`}
                  >
                    {a.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-mono text-[11px] uppercase tracking-wider ${
                        a.on ? "text-ink-100" : "text-ink-400"
                      }`}
                    >
                      {a.id}
                    </p>
                    <p className="truncate text-[11px] text-ink-400">{a.desc}</p>
                  </div>
                  {a.active ? (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
                    </span>
                  ) : a.on ? (
                    <IcCheck className="text-emerald-300" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-ink-600" />
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-ink-700 pt-3 text-[11px] leading-relaxed text-ink-400">
              Подрядчики никогда не регистрируются. Отклики заходят через
              Smart-Link — так Aura выигрывает рынки с нулевым предложением в
              первый же день.
            </p>
          </Panel>
        </div>
      </div>

      {/* ---- сравнение ---- */}
      <div className="mt-5">
        <BidTable tender={tender} revealed={revealedBids} />
      </div>

      {/* ---- решение / эскроу ---- */}
      <AnimatePresence>
        {phase === "decision" && pick && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
          >
            {secured ? (
              <Panel className="flex flex-wrap items-center gap-4 border-emerald-400/30 p-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-400/15 text-xl text-emerald-300">
                  <IcShield />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-50">
                    Эскроу <span className="font-mono text-emerald-300">{secured}</span> открыт ·{" "}
                    {fmtRub(pick.final)} заморожено
                  </p>
                  <p className="mt-0.5 text-xs text-ink-300">
                    {tender.escrow.milestones.join(" · ")} — раскрытие только по акту приёмки.
                  </p>
                </div>
                <span className="ml-auto rounded-md border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-emerald-300">
                  средства заморожены
                </span>
              </Panel>
            ) : (
              <Panel className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-ink-300">
                      <span className="font-semibold text-violet-300">
                        {pick.company}
                      </span>{" "}
                      за <span className="font-mono text-ink-50">{fmtRub(pick.final)}</span>{" "}
                      под ключ · доверие {pick.trust} · гарантия {pick.warranty}
                    </p>
                    <p className="mt-1 flex items-start gap-1.5 text-[11.5px] text-ink-400">
                      <IcShield className="mt-0.5 shrink-0 text-violet-300" />
                      {tender.escrow.freeze_note} Комиссия {tender.escrow.fee_pct}% · мгновенный возврат, если подрядчик пропал.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:flex-row lg:shrink-0">
                    <button
                      onClick={() => setEscrowOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-400 px-5 py-3 text-sm font-semibold text-ink-950 transition-all duration-200 hover:bg-violet-300 hover:shadow-[0_0_30px_-6px_rgba(167,139,250,0.8)] active:scale-[0.98]"
                    >
                      <IcShield /> Зафиксировать сделку · {fmtRub(pick.final)}
                    </button>
                    <button
                      onClick={() => setContactsOpen((o) => !o)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-600 px-5 py-3 text-sm text-ink-300 transition-all hover:border-ink-400 hover:text-ink-100"
                    >
                      Просто контакты
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {contactsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid gap-2 border-t border-ink-700 pt-4 sm:grid-cols-2">
                        {tender.bids
                          .filter((b) => revealedBids.includes(b.id))
                          .map((b) => (
                            <div
                              key={b.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-850/70 px-3.5 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-ink-100">
                                  {b.company}
                                </p>
                                <p className="font-mono text-[11px] text-ink-300">
                                  {b.phone}
                                </p>
                              </div>
                              <button
                                onClick={() => copy(b.phone)}
                                className="rounded-md border border-ink-600 p-1.5 text-ink-300 transition-colors hover:border-violet-400/50 hover:text-violet-300"
                                aria-label={`скопировать телефон ${b.company}`}
                              >
                                <IcCopy />
                              </button>
                            </div>
                          ))}
                      </div>
                      <p className="mt-2 font-mono text-[10px] text-ink-500">
                        без эскроу Aura не сможет проверить финальный счёт — имейте в виду.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Panel>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- модалка эскроу ---- */}
      <AnimatePresence>
        {escrowOpen && pick && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/85 p-4 sm:items-center"
            onClick={() => setEscrowOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-violet-400/30 bg-ink-850 p-6 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(167,139,250,0.4)]"
            >
              <div className="flex items-center justify-between">
                <SectionLabel className="text-violet-300">подтверждение эскроу</SectionLabel>
                <button
                  onClick={() => setEscrowOpen(false)}
                  className="text-ink-400 transition-colors hover:text-ink-100"
                  aria-label="закрыть"
                >
                  <IcX />
                </button>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-ink-50">
                {pick.company} · {fmtRub(pick.final)}
              </h3>
              <p className="mt-1 text-xs text-ink-400">{tender.title} · задача #{tender.task_id}</p>
              <ul className="mt-4 space-y-2">
                {tender.escrow.milestones.map((m, i) => (
                  <li key={m} className="flex items-center gap-2.5 text-[12.5px] text-ink-200">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-violet-400/40 bg-violet-400/10 font-mono text-[9px] text-violet-300">
                      {i + 1}
                    </span>
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-lg border border-ink-700 bg-ink-950/60 p-3 text-[11.5px] leading-relaxed text-ink-300">
                {tender.escrow.freeze_note} Комиссия сервиса {tender.escrow.fee_pct}% · споры
                разбирают арбитры Aura за 24 часа.
              </p>
              <button
                onClick={() => {
                  const id = newOrderId();
                  setSecured(id);
                  patchActive({ secured: true });
                  setEscrowOpen(false);
                  pushToast("Эскроу открыт — средства заморожены до приёмки", "violet");
                }}
                className="mt-5 w-full rounded-lg bg-violet-400 py-3 text-sm font-semibold text-ink-950 transition-all hover:bg-violet-300 hover:shadow-[0_0_30px_-6px_rgba(167,139,250,0.8)] active:scale-[0.98]"
              >
                Заморозить {fmtRub(pick.final)} в эскроу
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  query,
  chip,
  done,
}: {
  query: string;
  chip: { label: string; cls: string; live: boolean };
  done: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <SectionLabel>сессия 0426 / тендерный агент / комната оркестратора</SectionLabel>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
          Решатель Услуг
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-300">
          Запрос:{" "}
          <span className="font-mono text-violet-200">
            «{query || "заменить 3 окна под ключ"}»
          </span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider ${chip.cls}`}
        >
          {chip.live && !done ? (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
          ) : (
            <IcCheck />
          )}
          {chip.label}
        </span>
        <AgentBadge agent="tender" />
      </div>
    </div>
  );
}

export { LiveDot };
