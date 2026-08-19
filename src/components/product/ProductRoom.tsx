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
   Медленный, логичный таймлайн работы агента
   ============================================================ */
const PHASES = [
  { at: 0, label: "Разбираю запрос…" },
  { at: 1100, label: "Категория зафиксирована" },
  { at: 2200, label: "Сканирую маркетплейсы и индексы цен…" },
  { at: 4200, label: "Торгуюсь за кэшбек-маршруты…" },
  { at: 5400, label: "Строю честный рейтинг…" },
  { at: 6600, label: "Готово — показываю математику" },
];

function useAgentPhase(ready: boolean, key: string) {
  const [phase, setPhase] = useState(0);
  const [scanned, setScanned] = useState(0);
  useEffect(() => {
    if (!ready) return;
    setPhase(0);
    setScanned(0);
    const ts = PHASES.map((p, i) =>
      window.setTimeout(() => setPhase(i + 1), p.at)
    );
    const scanStart = PHASES[2].at;
    const iv = window.setInterval(() => {
      const el = performance.now() - t0;
      if (el > scanStart) {
        setScanned((s) => Math.min(14, s + 1));
      }
    }, 130);
    const t0 = performance.now();
    return () => {
      ts.forEach(clearTimeout);
      clearInterval(iv);
    };
  }, [ready, key]);
  return { phase, scanned };
}

/* ============================================================
   Витрина: 4 товара, 4 разных формата карточек
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
      className={`group relative overflow-hidden rounded-[20px] border-[1.5px] border-ink-50 bg-ink-800 text-left shadow-[4px_4px_0_#211b14] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[7px_7px_0_#211b14] ${style.cls}`}
    >
      <div className="relative h-44 overflow-hidden md:h-full">
        <MediaImg
          src={p.image}
          alt={p.name}
          icon={<IcTag />}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border-[1.5px] border-ink-50 bg-paper px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-ink-200 shadow-[2px_2px_0_#211b14]">
          {style.icon}
          {style.label}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-semibold leading-tight text-ink-50">
              {p.name}
            </h3>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-400">
              {p.category}
            </p>
          </div>
          <span className="shrink-0 -rotate-2 rounded-[10px] border-[1.5px] border-ink-50 bg-[#12857a] px-2 py-1 font-mono text-[10px] font-bold text-paper shadow-[2px_2px_0_#211b14]">
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
                  className={`rounded-md border-[1.5px] px-2 py-0.5 font-mono text-[10.5px] font-bold transition-colors ${
                    out
                      ? "border-ink-600 text-ink-500 line-through"
                      : "border-ink-50 bg-paper text-ink-200 group-hover:border-[#12857a] group-hover:text-[#0e6e62]"
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
              <span className="font-mono font-bold text-[#0e6e62]">
                {p.extras.alt_offers!.length + 1} · партнёр выигрывает
              </span>
            </li>
          </ul>
        )}

        {p.layout === "tv" && p.extras && (
          <div className="mt-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-ink-400">
              <span>момент покупки</span>
              <span className="font-bold text-[#0e6e62]">{p.extras.meter}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-ink-600 bg-ink-900">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${p.extras.meter}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-[#12857a] to-[#1b9c8d]"
              />
            </div>
            <p className="mt-2 text-[11.5px] text-ink-300">
              цена {p.extras.weeks_down} недель подряд вниз — дно близко
            </p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <PriceTag p={p} />
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-ink-50 bg-paper text-ink-100 shadow-[2px_2px_0_#211b14] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[#12857a] group-hover:text-paper">
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
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl">
            Честная витрина
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-300">
            Запрос: <span className="font-mono text-cyan-200">«{query || "что сегодня выгодно взять"}»</span>{" "}
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
          <stop offset="0%" stopColor="#12857a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#12857a" stopOpacity="0" />
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
        stroke="#12857a"
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active ? 1 : 0 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      />
      <motion.circle
        cx={last[0]}
        cy={last[1]}
        r="4.5"
        fill="#12857a"
        stroke="#fdf9ef"
        strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ delay: 1.2 }}
      />
    </svg>
  );
}

function Gauge({ value, active }: { value: number; active: boolean }) {
  const R = 52;
  const C = Math.PI * R;
  return (
    <div className="relative h-[72px] w-[124px]">
      <svg viewBox="0 0 124 72" className="h-full w-full">
        <path d={`M10 66 A ${R} ${R} 0 0 1 114 66`} fill="none" stroke="#e8dfc9" strokeWidth="10" strokeLinecap="round" />
        <motion.path
          d={`M10 66 A ${R} ${R} 0 0 1 114 66`}
          fill="none"
          stroke="#12857a"
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
            className="sticker flex h-9 w-9 items-center justify-center rounded-[12px] bg-paper text-ink-100"
            aria-label="Назад к витрине"
          >
            <IcChevron className="rotate-180" />
          </button>
          <div>
            <SectionLabel>агент товаров / детальный разбор</SectionLabel>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-50 sm:text-3xl">
              {p.name}
            </h2>
          </div>
        </div>
        <AgentBadge agent="product" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-12">
        {/* ---- левая колонка: следы работы агента ---- */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          <Panel className="rounded-[20px] border-[1.5px] border-ink-50 p-5 shadow-[4px_4px_0_#211b14]">
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
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] text-[9px] font-bold transition-all duration-300 ${
                        isDone
                          ? "border-ink-50 bg-[#12857a] text-paper"
                          : current
                            ? "border-[#12857a] text-[#12857a]"
                            : "border-ink-600 text-ink-500"
                      }`}
                    >
                      {isDone ? <IcCheck /> : i + 1}
                    </span>
                    <span
                      className={`transition-colors duration-300 ${
                        isDone ? "text-ink-100" : current ? "font-semibold text-[#0e6e62]" : "text-ink-500"
                      }`}
                    >
                      {s.label}
                      {i === 2 && current && (
                        <span className="ml-2 font-mono text-[11px] text-[#12857a]">
                          {scanned}/14
                        </span>
                      )}
                      {current && (
                        <span className="caret ml-1.5 inline-block h-3 w-[6px] translate-y-0.5 bg-[#12857a]" />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className="rounded-[20px] border-[1.5px] border-ink-50 p-5 shadow-[4px_4px_0_#211b14]">
            <SectionLabel>индекс цены · 90 дней</SectionLabel>
            <div className="mt-3">
              <Sparkline data={p.price_index_90d} active={done} />
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-ink-400">
              <span>−90 дней</span>
              <span className="font-bold text-[#0e6e62]">
                дно {fmtRub(Math.min(...p.price_index_90d))}
              </span>
              <span>сегодня</span>
            </div>
          </Panel>

          {p.extras?.meter !== undefined && (
            <Panel className="flex items-center justify-between rounded-[20px] border-[1.5px] border-ink-50 p-5 shadow-[4px_4px_0_#211b14]">
              <div>
                <SectionLabel>индекс момента покупки</SectionLabel>
                <p className="mt-2 max-w-[220px] text-[12px] leading-relaxed text-ink-300">
                  {p.extras.verdict}
                </p>
              </div>
              <Gauge value={p.extras.meter} active={done} />
            </Panel>
          )}

          <Panel className="rounded-[20px] border-[1.5px] border-ink-50 p-5 shadow-[4px_4px_0_#211b14]">
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
                        ? "font-bold text-[#0e6e62]"
                        : row.tone === "bad"
                          ? "font-bold text-red-400"
                          : "text-ink-200"
                    }`}
                  >
                    {row.value}
                  </span>
                </motion.li>
              ))}
            </ul>
            <p className="mt-3 border-t border-ink-700 pt-3 font-mono text-[10px] text-ink-400">
              {p.cashback_source}
            </p>
          </Panel>
        </div>

        {/* ---- правая колонка: честный выбор ---- */}
        <div className="lg:col-span-7">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={phase >= 2 ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
            transition={{ duration: 0.6 }}
          >
            <Panel className="overflow-hidden rounded-[22px] border-[1.5px] border-ink-50 shadow-[5px_5px_0_#211b14]">
              <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <AgentBadge agent="product" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
                    честный выбор
                  </span>
                </div>
                <span className="rounded-md border-[1.5px] border-ink-50 bg-[#12857a] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-paper shadow-[2px_2px_0_#211b14]">
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
                  <h3 className="font-display text-xl font-semibold text-ink-50">{p.name}</h3>
                  <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
                    {p.category} · источников: {p.marketplaces_scanned}
                  </p>

                  {/* вариант для кроссовок: цвет + размер */}
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
                            className={`h-7 w-7 rounded-full border-[1.5px] transition-all ${
                              i === color ? "border-ink-50 shadow-[2px_2px_0_#211b14]" : "border-ink-600 opacity-60 hover:opacity-100"
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
                                className={`rounded-lg border-[1.5px] px-2.5 py-1 font-mono text-[11.5px] font-bold transition-all ${
                                  out
                                    ? "cursor-not-allowed border-ink-700 text-ink-500 line-through"
                                    : size === s
                                      ? "border-ink-50 bg-[#12857a] text-paper shadow-[2px_2px_0_#211b14]"
                                      : "border-ink-50 bg-paper text-ink-200 hover:-translate-y-0.5 hover:shadow-[2px_2px_0_#211b14]"
                                }`}
                              >
                                {s}
                              </button>
                            );
                          })}
                        </div>
                        {p.extras.out!.length > 0 && (
                          <p className="mt-1.5 font-mono text-[9.5px] text-ink-400">
                            зачёркнутые размеры закончились у партнёра
                          </p>
                        )}
                      </motion.div>
                    </div>
                  )}

                  {/* спеки для техники */}
                  {p.layout === "appliance" && p.extras && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {p.extras.specs!.map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-ink-700 bg-ink-900 px-2.5 py-1.5">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-ink-400">{k}</p>
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
                animate={phase >= 5 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
                className="relative grid gap-4 p-5 pt-1 sm:grid-cols-2"
              >
                <div className="rounded-[16px] border-[1.5px] border-dashed border-ink-500 bg-ink-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                      вариант A · рыночный пол
                    </span>
                    <span className="rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-400">
                      просто дешевле
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink-200">{market.retailer}</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-ink-300 line-through decoration-red-400/70 decoration-2">
                    {fmtRub(market.price)}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-ink-400">
                    <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400" />{market.delivery}</li>
                    <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400" />{market.warranty}</li>
                    <li className="flex gap-2"><IcX className="mt-0.5 shrink-0 text-red-400" />{market.returns}</li>
                  </ul>
                </div>

                <div className="relative rounded-[16px] border-2 border-[#12857a] bg-[#12857a]/8 p-4 shadow-[4px_4px_0_#12857a]">
                  <span className="absolute -right-2.5 -top-3 rotate-3 rounded-[10px] border-[1.5px] border-ink-50 bg-[#e8a33d] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-50 shadow-[2px_2px_0_#211b14]">
                    выгода −{fmtInt(p.savings_vs_market)} ₽
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#0e6e62]">
                      вариант B · выбор Aura
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-ink-100">{partner.retailer}</p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-ink-300">
                    <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-[#12857a]" />{partner.delivery}</li>
                    <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-[#12857a]" />{partner.warranty}</li>
                    <li className="flex gap-2"><IcCheck className="mt-0.5 shrink-0 text-[#12857a]" />{partner.returns}</li>
                  </ul>
                </div>
              </motion.div>

              {/* математика */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={done ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mx-5 mb-5 rounded-[16px] border-[1.5px] border-ink-50 bg-paper p-5 shadow-[3px_3px_0_#211b14]"
              >
                <SectionLabel>математика начистоту</SectionLabel>
                <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono">
                  <span className="text-lg font-semibold text-ink-200">
                    <Money value={partner.price} active={done} />
                  </span>
                  <span className="text-ink-400">−</span>
                  <span className="text-lg font-semibold text-[#12857a]">
                    <Money value={partner.cashback} active={done} duration={1100} />
                  </span>
                  <span className="text-ink-400">=</span>
                  <span className="text-3xl font-bold text-ink-50">
                    <Money value={partner.final} active={done} duration={1300} />
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="rounded-full bg-[#12857a]/12 px-2.5 py-1 font-mono font-bold text-[#0e6e62]">
                    кэшбек {pct(partner.cashback_rate)} сразу
                  </span>
                  <span className="text-ink-400">
                    дешевле рыночного пола на{" "}
                    <span className="font-mono font-bold text-[#0e6e62]">{fmtRub(p.savings_vs_market)}</span>{" "}
                    — с официальной гарантией.
                  </span>
                </div>
              </motion.div>

              {/* таблица сравнения */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={done ? { opacity: 1 } : {}}
                transition={{ delay: 0.35 }}
                className="mx-5 mb-5 overflow-hidden rounded-[14px] border border-ink-700"
              >
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-ink-700 bg-ink-900 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-400">
                      <th className="px-3.5 py-2 font-medium">критерий</th>
                      <th className="px-3.5 py-2 font-medium">A · {market.retailer}</th>
                      <th className="px-3.5 py-2 font-medium text-[#0e6e62]">B · Aura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cmpRows.map(([k, a, b, hl]) => (
                      <tr
                        key={k}
                        className={`border-b border-ink-700/70 last:border-0 ${
                          hl ? "bg-[#12857a]/10 font-bold" : ""
                        }`}
                      >
                        <td className="px-3.5 py-2 text-ink-300">{k}</td>
                        <td className={`px-3.5 py-2 font-mono ${hl ? "text-ink-300 line-through" : "text-ink-200"}`}>{a}</td>
                        <td className={`px-3.5 py-2 font-mono ${hl ? "text-base text-[#0e6e62]" : "text-ink-100"}`}>{b}</td>
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
                      <li key={o.retailer} className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-[11.5px]">
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
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-ink-50 bg-[#12857a] text-lg text-paper shadow-[2px_2px_0_#211b14]">
                        <IcCheck />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ink-50">
                          Заказ <span className="font-mono text-[#0e6e62]">{order}</span> создан
                        </p>
                        <p className="mt-0.5 text-xs text-ink-300">
                          {fmtRub(partner.cashback)} в Aura-кошельке · {partner.delivery}
                        </p>
                      </div>
                      <span className="ml-auto inline-flex items-center gap-2 rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] text-ink-300">
                        <IcShield className="text-[#12857a]" /> серийник в очереди на проверку
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
                        className="sticker inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#12857a] px-5 py-3 text-sm font-bold text-paper disabled:opacity-70"
                      >
                        {claiming ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
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
                          pushToast("Открываю маркетплейс без кэшбека — так дороже на " + fmtRub(p.savings_vs_market), "slate")
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-ink-600 px-5 py-3 text-sm font-semibold text-ink-300 transition-all hover:border-ink-400 hover:text-ink-100"
                      >
                        Купить без кэшбека <IcArrow className="text-ink-500" />
                      </button>
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400 sm:ml-auto">
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
   Комната товаров: витрина + детали
   ============================================================ */
export function ProductRoom() {
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const setActiveProduct = useAuraStore((s) => s.setActiveProduct);
  const patchActive = useAuraStore((s) => s.patchActive);
  const query = useAuraStore((s) => s.query);
  const sessions = useAuraStore((s) => s.sessions);
  const activeId = useAuraStore((s) => s.activeId);

  const products = useMemo(() => data ?? [], [data]);
  const session = sessions.find((x) => x.id === activeId);
  const active = products.find((p) => p.id === session?.productId);

  if (isLoading) {
    return (
      <div data-accent="cyan">
        <SectionLabel>сессия 0426 / агент товаров</SectionLabel>
        <h2 className="mt-3 font-display text-3xl font-bold text-ink-50">Честная витрина</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-[20px] border-[1.5px] border-ink-50 bg-ink-800 p-6 shadow-[4px_4px_0_#211b14]"
              style={{ ["--acc-rgb" as string]: "18 133 122" }}
            >
              <div className="shimmer-bar h-4 w-40 rounded" />
              <div className="mt-6 space-y-3">
                {[100, 84, 66].map((w, j) => (
                  <div key={j} className="h-3 rounded-full bg-ink-700" style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 font-mono text-xs font-semibold text-[#0e6e62]">
          <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-[#12857a]" />
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
