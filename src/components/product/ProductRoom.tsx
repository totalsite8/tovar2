import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, newOrderId } from "../../data/api";
import type { ProductPayload } from "../../data/types";
import { useAuraStore } from "../../store/useAuraStore";
import { fmtInt, fmtRub, pct } from "../../lib/format";
import {
  AgentBadge,
  LiveDot,
  MediaImg,
  Money,
  Panel,
  SectionLabel,
} from "../shared/Primitives";
import {
  IcArrow,
  IcCheck,
  IcChevron,
  IcRadar,
  IcScale,
  IcShield,
  IcSpark,
  IcTag,
  IcTv,
  IcVacuum,
  IcWallet,
  IcX,
} from "../shared/icons";

/* ============================================================
   Таймлайн работы агента (постепенный, как живой поиск)
   ============================================================ */
const PHASES = [
  { at: 0, label: "Разбираю запрос…" },
  { at: 900, label: "Категория зафиксирована" },
  { at: 1900, label: "Сканирую маркетплейсы и индексы цен…" },
  { at: 3200, label: "Торгуюсь за кэшбек-маршруты…" },
  { at: 4300, label: "Готово — показываю математику" },
];

function useAgentPhase(ready: boolean, key: string) {
  const [phase, setPhase] = useState(0);
  const [scanned, setScanned] = useState(0);
  useEffect(() => {
    if (!ready) return;
    setPhase(0);
    setScanned(0);
    const t0 = performance.now();
    const ts = PHASES.map((p, i) =>
      window.setTimeout(() => setPhase(i + 1), p.at)
    );
    const scanStart = PHASES[2].at;
    const iv = window.setInterval(() => {
      if (performance.now() - t0 > scanStart) {
        setScanned((s) => Math.min(14, s + 1));
      }
    }, 150);
    return () => {
      ts.forEach(clearTimeout);
      clearInterval(iv);
    };
  }, [ready, key]);
  return { phase, scanned };
}

/* ============================================================
   Витрина: 4 товара — 4 разных формата карточек
   ============================================================ */
const CARD_STYLES: Record<
  string,
  { cls: string; label: string; icon: React.ReactNode }
> = {
  audio: {
    cls: "md:col-span-2 md:grid md:grid-cols-[1.15fr_1fr]",
    label: "досье агента",
    icon: <IcTag />,
  },
  sneakers: {
    cls: "flex flex-col",
    label: "подбор размера",
    icon: <IcRadar />,
  },
  appliance: {
    cls: "flex flex-col",
    label: "сравнение офферов",
    icon: <IcVacuum />,
  },
  tv: {
    cls: "flex flex-col",
    label: "момент покупки",
    icon: <IcTv />,
  },
};

function PriceTag({ p }: { p: ProductPayload }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-xl font-bold text-ink-50">
        {fmtRub(p.partner.final)}
      </span>
      <span className="font-mono text-xs text-ink-400 line-through">
        {fmtRub(p.market_cheapest.price)}
      </span>
    </div>
  );
}

function ProductCard({
  p,
  onOpen,
  i,
}: {
  p: ProductPayload;
  onOpen: () => void;
  i: number;
}) {
  const style = CARD_STYLES[p.layout];
  return (
    <motion.button
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-xl border border-ink-700 bg-ink-800 text-left transition-all duration-300 hover:-translate-y-1 hover:border-ink-500 hover:shadow-[0_20px_50px_-20px_rgba(103,232,249,0.35)] ${style.cls}`}
    >
      <div className="relative h-44 overflow-hidden md:h-full">
        <MediaImg
          src={p.image}
          alt={p.name}
          icon={<IcTag />}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-950/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-cyan-300 backdrop-blur-sm">
          {style.icon}
          {style.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold leading-tight text-ink-50">
              {p.name}
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
              {p.category}
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] font-bold text-cyan-300">
            −{fmtInt(p.savings_vs_market)} ₽
          </span>
        </div>

        {p.layout === "audio" && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-300">
            Рыночный пол {fmtRub(p.market_cheapest.price)} — серый импорт.
            Партнёр + кэшбек {fmtRub(p.partner.cashback)} выходит дешевле, с
            официальной гарантией. Вся математика внутри.
          </p>
        )}

        {p.layout === "sneakers" && p.extras && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.extras.sizes!.map((s) => {
              const out = p.extras!.out!.includes(s);
              return (
                <span
                  key={s}
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-bold ${
                    out
                      ? "border-ink-700 text-ink-500 line-through"
                      : "border-ink-600 text-ink-200 group-hover:border-cyan-400/50 group-hover:text-cyan-200"
                  }`}
                >
                  {s}
                </span>
              );
            })}
          </div>
        )}

        {p.layout === "appliance" && p.extras && (
          <ul className="mt-3 space-y-1">
            {p.extras.specs!.slice(0, 2).map(([k, v]) => (
              <li key={k} className="flex justify-between gap-3 text-[11.5px]">
                <span className="text-ink-400">{k}</span>
                <span className="font-mono text-ink-200">{v}</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 pt-1 text-[11.5px]">
              <span className="text-ink-400">офферов сравнено</span>
              <span className="font-mono font-bold text-cyan-300">
                {p.extras.alt_offers!.length + 1} · партнёр выигрывает
              </span>
            </li>
          </ul>
        )}

        {p.layout === "tv" && p.extras && (
          <div className="mt-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <span>момент покупки</span>
              <span className="font-bold text-cyan-300">{p.extras.meter}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-700">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${p.extras.meter}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300"
              />
            </div>
            <p className="mt-2 text-[11.5px] text-ink-300">
              цена {p.extras.weeks_down} недель подряд вниз — дно близко
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <PriceTag p={p} />
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition-all duration-300 group-hover:translate-x-1 group-hover:border-cyan-400/50 group-hover:bg-cyan-400/10 group-hover:text-cyan-300">
            <IcArrow />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function Showcase({
  products,
  onOpen,
  query,
}: {
  products: ProductPayload[];
  onOpen: (id: string) => void;
  query: string;
}) {
  return (
    <div data-accent="cyan">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionLabel>сессия 0426 / агент товаров</SectionLabel>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
            Честная витрина
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Запрос:{" "}
            <span className="font-mono text-cyan-200">
              «{query || "что сегодня выгодно взять"}»
            </span>{" "}
            — агент отобрал 4 позиции, где кэшбек бьёт рыночное дно.
          </p>
        </div>
        <AgentBadge agent="product" />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {products.map((p, i) => (
          <ProductCard key={p.id} p={p} i={i} onOpen={() => onOpen(p.id)} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Детальный разбор товара
   ============================================================ */
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
        transition={{ delay: 0.8, duration: 0.8 }}
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

function Gauge({ value, active }: { value: number; active: boolean }) {
  const R = 52;
  return (
    <div className="relative h-[72px] w-[124px]">
      <svg viewBox="0 0 124 72" className="h-full w-full">
        <path d={`M10 66 A ${R} ${R} 0 0 1 114 66`} fill="none" stroke="#1b1f2b" strokeWidth="10" strokeLinecap="round" />
        <motion.path
          d={`M10 66 A ${R} ${R} 0 0 1 114 66`}
          fill="none"
          stroke="#67e8f9"
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? value / 100 : 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <span className="absolute inset-x-0 bottom-0 text-center font-mono text-lg font-bold text-ink-50">
        <Money value={value} active={active} />
        <span className="text-xs">%</span>
      </span>
    </div>
  );
}

function ProductDetail({
  p,
  onBack,
  claimed,
  onClaimed,
}: {
  p: ProductPayload;
  onBack: () => void;
  claimed?: boolean;
  onClaimed: () => void;
}) {
  const pushToast = useAuraStore((s) => s.pushToast);
  const { phase, scanned } = useAgentPhase(true, p.id);
  const done = phase >= PHASES.length;

  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [order, setOrder] = useState<string | null>(claimed ? "AUR-РАНЕЕ" : null);
  const [shakeSize, setShakeSize] = useState(0);

  const partner = p.partner;
  const market = p.market_cheapest;

  function claim() {
    if (claiming || order) return;
    if (p.layout === "sneakers" && !size) {
      setShakeSize((s) => s + 1);
      pushToast("Сначала выберите размер — без него заказ не оформить", "amber");
      return;
    }
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      setOrder(newOrderId());
      onClaimed();
      pushToast(`Кэшбек ${fmtRub(partner.cashback)} зачислен в Aura-кошелёк`, "cyan");
    }, 1100);
  }

  const cmpRows: [string, string, string, boolean?][] = [
    ["Цена на полке", fmtRub(market.price), fmtRub(partner.price)],
    ["Кэшбек Aura", "—", `−${fmtRub(partner.cashback)}`],
    ["Итоговая цена", fmtRub(market.price), fmtRub(partner.final), true],
    ["Гарантия", market.warranty, partner.warranty],
    ["Доставка", market.delivery, partner.delivery],
    ["Возврат", market.returns, partner.returns],
  ];

  return (
    <div data-accent="cyan">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-600 text-ink-200 transition-all hover:border-cyan-400/50 hover:text-cyan-300"
            aria-label="Назад к витрине"
          >
            <IcChevron className="rotate-180" />
          </button>
          <div>
            <SectionLabel>агент товаров / детальный разбор</SectionLabel>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink-50 sm:text-3xl">
              {p.name}
            </h2>
          </div>
        </div>
        <AgentBadge agent="product" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        {/* ---- слева: следы работы агента ---- */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>следы работы агента</SectionLabel>
              <LiveDot />
            </div>
            <ul className="mt-4 space-y-3">
              {PHASES.map((s, i) => {
                const isDone = phase > i;
                const current = phase === i;
                return (
                  <li key={s.label} className="flex items-start gap-3 text-[13px]">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] transition-all duration-300 ${
                        isDone
                          ? "border-cyan-300 bg-cyan-400/20 text-cyan-300"
                          : current
                            ? "border-cyan-400/50 text-cyan-300"
                            : "border-ink-600 text-ink-500"
                      }`}
                    >
                      {isDone ? <IcCheck /> : i + 1}
                    </span>
                    <span
                      className={`transition-colors duration-300 ${
                        isDone ? "text-ink-100" : current ? "text-cyan-200" : "text-ink-500"
                      }`}
                    >
                      {s.label}
                      {i === 2 && current && (
                        <span className="ml-2 font-mono text-[11px] text-cyan-300">
                          {scanned}/14
                        </span>
                      )}
                      {current && (
                        <span className="caret ml-1.5 inline-block h-3 w-[6px] translate-y-0.5 bg-cyan-300" />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className="p-5">
            <SectionLabel>индекс цены · 90 дней</SectionLabel>
            <div className="mt-3">
              <Sparkline data={p.price_index_90d} active={done} />
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-ink-400">
              <span>−90 дней</span>
              <span className="text-cyan-300">
                дно {fmtRub(Math.min(...p.price_index_90d))}
              </span>
              <span>сегодня</span>
            </div>
          </Panel>

          {p.extras?.meter !== undefined && (
            <Panel className="flex items-center justify-between p-5">
              <div>
                <SectionLabel>индекс момента покупки</SectionLabel>
                <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-ink-300">
                  {p.extras.verdict}
                </p>
              </div>
              <Gauge value={p.extras.meter} active={done} />
            </Panel>
          )}

          <Panel className="p-5">
            <SectionLabel>журнал доверия</SectionLabel>
            <ul className="mt-3 divide-y divide-ink-700">
              {p.trust_ledger.map((row, i) => (
                <motion.li
                  key={row.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={done ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between gap-4 py-2.5 text-xs"
                >
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
                </motion.li>
              ))}
            </ul>
            <p className="mt-3 border-t border-ink-700 pt-3 font-mono text-[10px] text-ink-500">
              {p.cashback_source}
            </p>
          </Panel>
        </div>

        {/* ---- справа: честный выбор ---- */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={phase >= 2 ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.6 }}
          >
            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <AgentBadge agent="product" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
                    честный выбор
                  </span>
                </div>
                <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
                  кэшбек найден
                </span>
              </div>

              <div className="grid sm:grid-cols-[210px_1fr]">
                <MediaImg
                  src={p.image}
                  alt={p.name}
                  icon={<IcTag />}
                  className="h-44 w-full object-cover sm:h-full"
                />
                <div className="p-5">
                  <h3 className="text-xl font-semibold text-ink-50">{p.name}</h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
                    {p.category} · источников: {p.marketplaces_scanned}
                  </p>

                  {p.layout === "sneakers" && p.extras && (
                    <div className="mt-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                        цвет: <span className="text-ink-200">{p.extras.colors![color].name}</span>
                      </p>
                      <div className="mt-1.5 flex gap-2">
                        {p.extras.colors!.map((c, i) => (
                          <button
                            key={c.name}
                            onClick={() => setColor(i)}
                            className={`h-7 w-7 rounded-full border transition-all ${
                              i === color ? "border-cyan-300 ring-2 ring-cyan-400/30" : "border-ink-600 opacity-60 hover:opacity-100"
                            }`}
                            style={{ background: c.hex }}
                            aria-label={c.name}
                          />
                        ))}
                      </div>
                      <motion.div animate={shakeSize ? { x: [0, -7, 7, -4, 4, 0] } : {}} key={shakeSize}>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                          размер (EU):
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {p.extras.sizes!.map((s) => {
                            const out = p.extras!.out!.includes(s);
                            return (
                              <button
                                key={s}
                                disabled={out}
                                onClick={() => setSize(s)}
                                className={`rounded-md border px-2.5 py-1 font-mono text-[11.5px] font-bold transition-all ${
                                  out
                                    ? "cursor-not-allowed border-ink-700 text-ink-500 line-through"
                                    : size === s
                                      ? "border-cyan-300 bg-cyan-400/20 text-cyan-200"
                                      : "border-ink-600 text-ink-200 hover:border-cyan-400/50 hover:text-cyan-200"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                        {p.extras.out!.length > 0 && (
                          <p className="mt-1.5 font-mono text-[9.5px] text-ink-500">
                            зачёркнутые размеры закончились у партнёра
                          </p>
                        )}
                      </motion.div>
                    </div>
                  )}

                  {p.layout === "appliance" && p.extras && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {p.extras.specs!.map(([k, v]) => (
                        <div key={k} className="rounded-md border border-ink-700 bg-ink-850 px-2.5 py-1.5">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-ink-500">{k}</p>
                          <p className="mt-0.5 text-[11.5px] font-semibold text-ink-100">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-4 text-[12.5px] leading-relaxed text-ink-300">
                    Самый дешёвый «сырой» вариант — {market.retailer.toLowerCase()} с
                    оговорками. Партнёрский маршрут на бумаге дороже, а по факту —
                    дешевле: кэшбек падает в кошелёк сразу.
                  </p>
                </div>
              </div>

              {/* A против B */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="relative grid gap-4 p-5 pt-1 sm:grid-cols-2"
              >
                <div className="rounded-lg border border-ink-700 border-dashed bg-ink-850/60 p-4 opacity-80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                      вариант A · рыночный пол
                    </span>
                    <span className="rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-400">
                      просто дешевле
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-200">{market.retailer}</p>
                  <p className="mt-1 font-mono text-2xl text-ink-200 line-through decoration-ink-500/60 decoration-2">
                    {fmtRub(market.price)}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-ink-400">
                    <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400/80" />{market.delivery}</li>
                    <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400/80" />{market.warranty}</li>
                    <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400/80" />{market.returns}</li>
                  </ul>
                </div>

                <div className="relative rounded-lg border border-cyan-400/40 bg-cyan-400/[0.06] p-4 shadow-[0_0_40px_-14px_rgba(103,232,249,0.5)]">
                  <span className="absolute -right-2 -top-2.5 rounded-md border border-cyan-300/50 bg-ink-950 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                    −{fmtInt(p.savings_vs_market)} ₽ vs пол
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                    вариант B · выбор Aura
                  </span>
                  <p className="mt-3 text-sm text-ink-100">{partner.retailer}</p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-ink-300">
                    <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-cyan-300" />{partner.delivery}</li>
                    <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-cyan-300" />{partner.warranty}</li>
                    <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-cyan-300" />{partner.returns}</li>
                  </ul>
                </div>
              </motion.div>

              {/* математика */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={done ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mx-5 mb-5 rounded-lg border border-ink-700 bg-ink-950/60 p-5"
              >
                <SectionLabel>математика начистоту</SectionLabel>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono">
                  <span className="text-lg text-ink-200">
                    <Money value={partner.price} active={done} />
                  </span>
                  <span className="text-ink-500">−</span>
                  <span className="text-lg text-cyan-300">
                    <Money value={partner.cashback} active={done} duration={1100} />
                  </span>
                  <span className="text-ink-500">=</span>
                  <span className="text-3xl font-bold text-ink-50">
                    <Money value={partner.final} active={done} duration={1300} />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded bg-cyan-400/15 px-2 py-1 font-mono text-cyan-200">
                    кэшбек {pct(partner.cashback_rate)} сразу
                  </span>
                  <span className="text-ink-400">
                    дешевле рыночного пола на{" "}
                    <span className="font-mono text-cyan-300">{fmtRub(p.savings_vs_market)}</span>{" "}
                    — с официальной гарантией.
                  </span>
                </div>
              </motion.div>

              {/* таблица сравнения */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={done ? { opacity: 1 } : {}}
                transition={{ delay: 0.35 }}
                className="mx-5 mb-5 overflow-x-auto rounded-lg border border-ink-700"
              >
                <table className="w-full min-w-[480px] text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-ink-700 bg-ink-850 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-400">
                      <th className="px-3.5 py-2 font-medium">критерий</th>
                      <th className="px-3.5 py-2 font-medium">A · {market.retailer}</th>
                      <th className="px-3.5 py-2 font-medium text-cyan-300">B · Aura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmpRows.map(([k, a, b, hl]) => (
                      <tr
                        key={k}
                        className={`border-b border-ink-700/70 last:border-0 ${
                          hl ? "bg-cyan-400/[0.07] font-bold" : ""
                        }`}
                      >
                        <td className="px-3.5 py-2 text-ink-300">{k}</td>
                        <td className={`px-3.5 py-2 font-mono ${hl ? "text-ink-400 line-through" : "text-ink-200"}`}>{a}</td>
                        <td className={`px-3.5 py-2 font-mono ${hl ? "text-base text-cyan-300" : "text-ink-100"}`}>{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>

              {/* альтернативные офферы */}
              {p.extras?.alt_offers && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={done ? { opacity: 1 } : {}}
                  transition={{ delay: 0.45 }}
                  className="mx-5 mb-5"
                >
                  <SectionLabel>что ещё видел агент</SectionLabel>
                  <ul className="mt-2.5 space-y-1.5">
                    {p.extras.alt_offers.map((o) => (
                      <li key={o.retailer} className="flex items-center justify-between rounded-md border border-ink-700 bg-ink-850 px-3 py-2 text-[11.5px]">
                        <span className="font-semibold text-ink-200">{o.retailer}</span>
                        <span className="font-mono text-ink-300">{fmtRub(o.price)}</span>
                        <span className="text-ink-400">{o.note}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* действия */}
              <div className="border-t border-ink-700 px-5 py-4">
                <AnimatePresence mode="wait">
                  {order ? (
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
                          Заказ <span className="font-mono text-cyan-300">{order}</span> создан
                        </p>
                        <p className="mt-0.5 text-xs text-ink-300">
                          {fmtRub(partner.cashback)} в Aura-кошельке · {partner.delivery}
                        </p>
                      </div>
                      <span className="ml-auto inline-flex items-center gap-2 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] text-ink-300">
                        <IcShield className="text-cyan-300" /> серийник в очереди на проверку
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-ink-950 transition-all duration-200 hover:bg-cyan-200 hover:shadow-[0_0_30px_-6px_rgba(103,232,249,0.8)] active:scale-[0.98] disabled:opacity-70"
                      >
                        {claiming ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                            Фиксирую маршрут…
                          </>
                        ) : (
                          <>
                            <IcWallet /> Забрать кэшбек и купить
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          pushToast(
                            "Открываю маркетплейс без кэшбека — так дороже на " + fmtRub(p.savings_vs_market),
                            "slate"
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-600 px-5 py-3 text-sm text-ink-300 transition-all hover:border-ink-400 hover:text-ink-100"
                      >
                        Купить без кэшбека <IcArrow className="text-ink-500" />
                      </button>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500 sm:ml-auto">
                        выплата · мгновенно
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Panel>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Комната товаров: витрина + детали (состояние в сессии)
   ============================================================ */
export function ProductRoom() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const query = useAuraStore((s) => s.query);
  const sessions = useAuraStore((s) => s.sessions);
  const activeId = useAuraStore((s) => s.activeId);
  const setActiveProduct = useAuraStore((s) => s.setActiveProduct);
  const patchActive = useAuraStore((s) => s.patchActive);

  const session = sessions.find((s) => s.id === activeId);
  const products = useMemo(() => data ?? [], [data]);
  const active = products.find((p) => p.id === session?.productId);

  if (isLoading) {
    return (
      <div data-accent="cyan">
        <SectionLabel>сессия 0426 / агент товаров</SectionLabel>
        <h2 className="mt-3 text-3xl font-semibold text-ink-50">Честная витрина</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-xl border border-ink-700 bg-ink-800 p-6"
              style={{ ["--acc-rgb" as string]: "103 232 249" }}
            >
              <div className="shimmer-bar h-4 w-40 rounded" />
              <div className="mt-6 space-y-3">
                {[100, 84, 66].map((w, j) => (
                  <div key={j} className="h-3 rounded bg-ink-700" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 font-mono text-xs text-cyan-300">
          <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-cyan-300" />
          агент товаров сканирует 14 источников…
        </p>
      </div>
    );
  }

  return active ? (
    <ProductDetail
      p={active}
      onBack={() => setActiveProduct(undefined)}
      claimed={session?.claimed}
      onClaimed={() => patchActive({ claimed: true })}
    />
  ) : (
    <Showcase products={products} onOpen={(id) => setActiveProduct(id)} query={query} />
  );
}

export { IcScale, IcSpark };
