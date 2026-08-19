import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts, newOrderId } from "../../data/api";
import type { ProductPayload } from "../../data/types";
import { useAuraStore } from "../../store/useAuraStore";
import { fmtRub, pct } from "../../lib/format";
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
  IcShield,
  IcTag,
  IcTv,
  IcVacuum,
  IcWallet,
  IcX,
} from "../shared/icons";

/* ================================================================
   КОМНАТА АГЕНТА ТОВАРОВ: витрина (4 разных формата карточек)
   + детальное досье товара с математикой кэшбека
   ================================================================ */

export function ProductRoom() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const sessions = useAuraStore((s) => s.sessions);
  const activeId = useAuraStore((s) => s.activeId);
  const query = useAuraStore((s) => s.query);
  const session = sessions.find((s) => s.id === activeId);
  const product = products?.find((p) => p.id === session?.productId);

  if (isLoading || !products) {
    return (
      <div data-accent="cyan">
        <RoomHeader query={query} back={false} />
        <div className="mt-6 grid gap-4 md:grid-cols-12">
          {[
            { c: "md:col-span-7", h: "h-64" },
            { c: "md:col-span-5", h: "h-64" },
            { c: "md:col-span-5", h: "h-56" },
            { c: "md:col-span-7", h: "h-56" },
          ].map((b, i) => (
            <Panel key={i} className={`${b.c} ${b.h} p-6`}>
              <div
                className="shimmer-bar h-4 w-40 rounded"
                style={{ ["--acc-rgb" as string]: "103 232 249" }}
              />
              <div className="mt-6 space-y-3">
                {[100, 84, 66].map((w, j) => (
                  <div key={j} className="h-3 rounded bg-ink-700" style={{ width: `${w}%` }} />
                ))}
              </div>
            </Panel>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 font-mono text-xs text-cyan-300">
          <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-cyan-300" />
          агент товаров сканирует маркетплейсы и кэшбек-маршруты…
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div data-accent="cyan">
        <RoomHeader query={query} back={false} />
        <Catalog products={products} />
      </div>
    );
  }

  return (
    <div data-accent="cyan">
      <RoomHeader query={query} back />
      <Detail key={product.id} product={product} claimed={!!session?.claimed} orderId={session?.orderId} />
    </div>
  );
}

/* ---------------- шапка ---------------- */
function RoomHeader({ query, back }: { query: string; back: boolean }) {
  const setActiveProduct = useAuraStore((s) => s.setActiveProduct);
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <SectionLabel>сессия 0426 / агент товаров</SectionLabel>
        <div className="mt-3 flex items-center gap-3">
          {back && (
            <button
              onClick={() => setActiveProduct(undefined)}
              className="group -ml-1 flex items-center gap-1 rounded-md border border-ink-600 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-300 transition-all hover:border-cyan-400/50 hover:text-cyan-300"
            >
              <IcArrow className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
              вся витрина
            </button>
          )}
          <h2 className="text-3xl font-semibold tracking-tight text-ink-50 sm:text-4xl">
            {back ? "Честный Выбор" : "Честная витрина"}
          </h2>
        </div>
        <p className="mt-2 max-w-xl text-sm text-ink-300">
          {back ? (
            <>
              Запрос:{" "}
              <span className="font-mono text-cyan-200">
                «{query || "самые дешёвые AirPods Pro 3"}»
              </span>
            </>
          ) : (
            <>
              Агент отобрал позиции под запрос{" "}
              <span className="font-mono text-cyan-200">«{query}»</span> — у каждой
              категории свой формат подачи, математика кэшбека везде одинаково открыта.
            </>
          )}
        </p>
      </div>
      <AgentBadge agent="product" />
    </div>
  );
}

/* ================================================================
   ВИТРИНА — разные представления товаров
   ================================================================ */

function MiniSpark({ data }: { data: number[] }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${30 - ((v - min) / (max - min)) * 26}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
      <polyline points={pts} fill="none" stroke="#67e8f9" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Catalog({ products }: { products: ProductPayload[] }) {
  const setActiveProduct = useAuraStore((s) => s.setActiveProduct);
  const pushToast = useAuraStore((s) => s.pushToast);
  const by = (id: string) => products.find((p) => p.id === id)!;
  const audio = by("airpods-pro-3");
  const sneak = by("asics-kayano-31");
  const vac = by("roborock-s8");
  const tv = by("lg-oled-c4");

  const open = (p: ProductPayload) => {
    setActiveProduct(p.id);
    pushToast(`Открываю досье: ${p.name}`, "cyan");
  };

  const cardCls =
    "group relative overflow-hidden rounded-xl border border-ink-700 bg-ink-800/70 text-left transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_20px_60px_-24px_rgba(103,232,249,0.5)]";

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-12">
      {/* --- аудио: широкая горизонтальная --- */}
      <motion.button
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => open(audio)}
        className={`${cardCls} md:col-span-7`}
      >
        <div className="grid sm:grid-cols-[220px_1fr]">
          <MediaImg src={audio.image} alt={audio.name} icon={<IcTag />} className="h-40 w-full object-cover sm:h-full" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                {audio.category}
              </span>
              <span className="rounded border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-300">
                выбор агента
              </span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-ink-50">{audio.name}</h3>
            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-sm text-ink-400 line-through">
                {fmtRub(audio.market_cheapest.price)}
              </span>
              <span className="font-mono text-2xl font-bold text-cyan-300">
                {fmtRub(audio.partner.final)}
              </span>
              <span className="rounded bg-cyan-400/15 px-2 py-0.5 font-mono text-[10px] text-cyan-200">
                −{fmtRub(audio.savings_vs_market)} от пола
              </span>
            </div>
            <p className="mt-2 text-[11.5px] text-ink-400">
              {audio.marketplaces_scanned} источников · кэшбек {pct(audio.partner.cashback_rate)} · официально
            </p>
          </div>
        </div>
      </motion.button>

      {/* --- кроссовки: вертикальная с размерной сеткой --- */}
      <motion.button
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
        onClick={() => open(sneak)}
        className={`${cardCls} flex flex-col md:col-span-5`}
      >
        <MediaImg src={sneak.image} alt={sneak.name} icon={<IcTag />} className="h-36 w-full object-cover" />
        <div className="flex flex-1 flex-col p-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
            {sneak.category}
          </span>
          <h3 className="mt-2 text-xl font-semibold text-ink-50">{sneak.name}</h3>
          <div className="mt-3 flex items-center gap-1.5">
            {sneak.extras?.colors?.map((c) => (
              <span
                key={c.name}
                className="h-3.5 w-3.5 rounded-full border border-ink-500"
                style={{ background: c.hex }}
                title={c.name}
              />
            ))}
            <span className="ml-1 font-mono text-[10px] text-ink-500">3 расцветки</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {sneak.extras?.sizes?.map((s) => {
              const out = sneak.extras?.out?.includes(s);
              return (
                <span
                  key={s}
                  className={`rounded border px-2 py-0.5 font-mono text-[10px] ${
                    out
                      ? "border-ink-700 text-ink-500 line-through"
                      : "border-ink-600 text-ink-300"
                  }`}
                >
                  {s}
                </span>
              );
            })}
          </div>
          <div className="mt-auto flex items-baseline gap-3 pt-4">
            <span className="font-mono text-sm text-ink-400 line-through">
              {fmtRub(sneak.market_cheapest.price)}
            </span>
            <span className="font-mono text-xl font-bold text-cyan-300">
              {fmtRub(sneak.partner.final)}
            </span>
          </div>
        </div>
      </motion.button>

      {/* --- пылесос: компактная со спеками --- */}
      <motion.button
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14 }}
        onClick={() => open(vac)}
        className={`${cardCls} md:col-span-5`}
      >
        <div className="grid grid-cols-[110px_1fr] gap-4 p-5">
          <MediaImg src={vac.image} alt={vac.name} icon={<IcVacuum />} className="h-full w-full rounded-lg object-cover" />
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
              {vac.category}
            </span>
            <h3 className="mt-1.5 text-lg font-semibold text-ink-50">{vac.name}</h3>
            <ul className="mt-2.5 space-y-1">
              {vac.extras?.specs?.slice(0, 3).map(([k, v]) => (
                <li key={k} className="flex justify-between gap-3 font-mono text-[10.5px]">
                  <span className="text-ink-500">{k}</span>
                  <span className="text-right text-ink-300">{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline gap-2.5">
              <span className="font-mono text-xs text-ink-400 line-through">
                {fmtRub(vac.market_cheapest.price)}
              </span>
              <span className="font-mono text-lg font-bold text-cyan-300">
                {fmtRub(vac.partner.final)}
              </span>
            </div>
          </div>
        </div>
      </motion.button>

      {/* --- ТВ: график тренда + «дно близко» --- */}
      <motion.button
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onClick={() => open(tv)}
        className={`${cardCls} md:col-span-7`}
      >
        <div className="grid sm:grid-cols-[200px_1fr]">
          <MediaImg src={tv.image} alt={tv.name} icon={<IcTv />} className="h-36 w-full object-cover sm:h-full" />
          <div className="p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                {tv.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-300">
                <span className="dot-live h-1.5 w-1.5 rounded-full bg-amber-300" />
                дно близко · {tv.extras?.meter}%
              </span>
            </div>
            <h3 className="mt-2 text-xl font-semibold text-ink-50">{tv.name}</h3>
            <div className="mt-2">
              <MiniSpark data={tv.price_index_90d} />
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-sm text-ink-400 line-through">
                {fmtRub(tv.market_cheapest.price)}
              </span>
              <span className="font-mono text-2xl font-bold text-cyan-300">
                {fmtRub(tv.partner.final)}
              </span>
              <span className="font-mono text-[10.5px] text-ink-400">
                {tv.extras?.weeks_down} недель цена падает · монтаж в подарок
              </span>
            </div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}

/* ================================================================
   ДЕТАЛЬНОЕ ДОСЬЕ
   ================================================================ */

const TRACE_STEPS = [
  "Намерение разобрано · категория зафиксирована",
  "Сканируем {n} маркетплейсов и индексы цен…",
  "Кэшбек-маршруты рассчитаны · CPA-офферы",
  "Честный рейтинг готов · рыночный пол vs партнёр",
];

function Detail({
  product,
  claimed,
  orderId,
}: {
  product: ProductPayload;
  claimed: boolean;
  orderId?: string;
}) {
  const patchActive = useAuraStore((s) => s.patchActive);
  const pushToast = useAuraStore((s) => s.pushToast);
  const [step, setStep] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeShake, setSizeShake] = useState(0);

  useEffect(() => {
    setStep(0);
    const id = window.setInterval(
      () => setStep((s) => (s < TRACE_STEPS.length ? s + 1 : s)),
      560
    );
    return () => clearInterval(id);
  }, []);

  const ready = step >= TRACE_STEPS.length;
  const p = product.partner;
  const m = product.market_cheapest;

  function claim() {
    if (claimed || claiming) return;
    if (product.extras?.sizes && !size) {
      setSizeShake((x) => x + 1);
      pushToast("Сначала выберите размер — без него заказ не собрать", "amber");
      return;
    }
    setClaiming(true);
    setTimeout(() => {
      setClaiming(false);
      patchActive({ claimed: true, orderId: newOrderId() });
      pushToast(`Кэшбек ${fmtRub(p.cashback)} зачислен в Aura-кошелёк`, "cyan");
    }, 1100);
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-12">
      {/* ------- левая колонка: работа агента ------- */}
      <div className="flex flex-col gap-5 lg:col-span-5">
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>трассировка агента</SectionLabel>
            <LiveDot />
          </div>
          <ul className="mt-4 space-y-3">
            {TRACE_STEPS.map((raw, i) => {
              const s = raw.replace("{n}", String(product.marketplaces_scanned));
              const done = step > i;
              const current = step === i;
              return (
                <li key={s} className="flex items-start gap-3 text-[13px]">
                  <span
                    className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[9px] transition-all duration-300 ${
                      done
                        ? "border-cyan-300 bg-cyan-400/20 text-cyan-300"
                        : current
                          ? "border-cyan-400/50 text-cyan-300"
                          : "border-ink-600 text-ink-500"
                    }`}
                  >
                    {done ? (
                      <IcCheck />
                    ) : current ? (
                      <span className="dot-live inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`transition-colors duration-300 ${
                      done ? "text-ink-100" : current ? "text-cyan-200" : "text-ink-500"
                    }`}
                  >
                    {s}
                    {current && (
                      <span className="caret ml-1 inline-block h-3 w-[6px] translate-y-0.5 bg-cyan-300" />
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
            <Sparkline data={product.price_index_90d} active={ready} />
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-ink-400">
            <span>−90 дн</span>
            <span className="text-cyan-300">
              дно {fmtRub(Math.min(...product.price_index_90d))}
            </span>
            <span>сегодня</span>
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionLabel>реестр доверия</SectionLabel>
          <ul className="mt-3 divide-y divide-ink-700">
            {product.trust_ledger.map((row) => (
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
            {product.cashback_source}
          </p>
        </Panel>
      </div>

      {/* ------- правая колонка: досье товара ------- */}
      <div className="lg:col-span-7">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <AgentBadge agent="product" />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
                честный выбор
              </span>
            </div>
            <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
              кэшбек-маршрут найден
            </span>
          </div>

          <div className="grid sm:grid-cols-[200px_1fr]">
            <MediaImg
              src={product.image}
              alt={product.name}
              icon={<IcTag />}
              className="h-44 w-full object-cover sm:h-full"
            />
            <div className="p-5">
              <h3 className="text-2xl font-semibold tracking-tight text-ink-50">
                {product.name}
              </h3>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-400">
                {product.category} · {product.marketplaces_scanned} источников
              </p>

              {/* ------- специфичная для категории подача ------- */}
              {product.layout === "sneakers" && product.extras && (
                <SneakersBody
                  extras={product.extras}
                  size={size}
                  setSize={setSize}
                  colorIdx={colorIdx}
                  setColorIdx={setColorIdx}
                  shake={sizeShake}
                />
              )}
              {product.layout === "appliance" && product.extras && (
                <ApplianceBody extras={product.extras} market={m} partnerFinal={p.final} partner={p.retailer} />
              )}
              {product.layout === "tv" && product.extras && <TvBody extras={product.extras} active={ready} />}
            </div>
          </div>

          {/* ------- A против B ------- */}
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-700 bg-ink-850/60 p-4 opacity-75">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                  вариант A · рыночный пол
                </span>
                <span className="rounded border border-ink-600 px-1.5 py-0.5 font-mono text-[9px] uppercase text-ink-400">
                  сырой минимум
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

            <div className="relative rounded-lg border border-cyan-400/40 bg-cyan-400/[0.06] p-4 shadow-[0_0_40px_-14px_rgba(103,232,249,0.5)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                  вариант B · выбор Aura
                </span>
                <span className="rounded border border-cyan-400/40 bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[9px] uppercase text-cyan-200">
                  −{fmtRub(product.savings_vs_market)} от пола
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

          {/* ------- математика ------- */}
          <div className="mx-5 mb-5 rounded-lg border border-ink-700 bg-ink-950/60 p-5">
            <SectionLabel>математика — открыто</SectionLabel>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2 font-mono">
              <span className="text-lg text-ink-200">
                <Money value={p.price} active={ready} />
              </span>
              <span className="text-ink-500">−</span>
              <span className="text-lg text-cyan-300">
                <Money value={p.cashback} active={ready} duration={1100} />
              </span>
              <span className="text-ink-500">=</span>
              <span className="text-3xl font-bold text-ink-50">
                <Money value={p.final} active={ready} duration={1300} />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded bg-cyan-400/15 px-2 py-1 font-mono text-cyan-200">
                {pct(p.cashback_rate)} мгновенного кэшбека
              </span>
              <span className="text-ink-400">
                дешевле рыночного пола на{" "}
                <span className="font-mono text-cyan-300">{fmtRub(product.savings_vs_market)}</span>{" "}
                — и с официальной гарантией.
              </span>
            </div>
          </div>

          {/* ------- действия ------- */}
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
                      Заказ <span className="font-mono text-cyan-300">{orderId}</span> создан
                    </p>
                    <p className="mt-0.5 text-xs text-ink-300">
                      {fmtRub(p.cashback)} в Aura-кошельке
                      {size ? ` · размер ${size}` : ""} · {p.delivery.toLowerCase()}
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
                        Фиксируем маршрут…
                      </>
                    ) : (
                      <>
                        <IcWallet /> Забрать кэшбек и купить
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      pushToast("Открываем маркетплейс — кэшбек не применится", "slate")
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-600 px-5 py-3 text-sm text-ink-300 transition-all duration-200 hover:border-ink-400 hover:text-ink-100"
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
      </div>
    </div>
  );
}

/* ---------------- категории: разная подача ---------------- */

function SneakersBody({
  extras,
  size,
  setSize,
  colorIdx,
  setColorIdx,
  shake,
}: {
  extras: NonNullable<ProductPayload["extras"]>;
  size: string | null;
  setSize: (s: string) => void;
  colorIdx: number;
  setColorIdx: (i: number) => void;
  shake: number;
}) {
  return (
    <div className="mt-4 rounded-lg border border-ink-700 bg-ink-950/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
          расцветка
        </span>
        {extras.colors?.map((c, i) => (
          <button
            key={c.name}
            onClick={() => setColorIdx(i)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-all ${
              i === colorIdx
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                : "border-ink-600 text-ink-300 hover:border-ink-400"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full border border-ink-500" style={{ background: c.hex }} />
            {c.name}
          </button>
        ))}
      </div>
      <motion.div
        key={shake}
        animate={shake ? { x: [0, -7, 7, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-3"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
          размер EU
        </span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {extras.sizes?.map((s) => {
            const out = extras.out?.includes(s);
            const sel = size === s;
            return (
              <button
                key={s}
                disabled={out}
                onClick={() => setSize(s)}
                className={`min-w-11 rounded-md border px-2.5 py-1.5 font-mono text-xs transition-all duration-150 ${
                  out
                    ? "cursor-not-allowed border-ink-700 text-ink-500 line-through opacity-60"
                    : sel
                      ? "border-cyan-300 bg-cyan-400/15 text-cyan-200 shadow-[0_0_16px_-4px_rgba(103,232,249,0.7)]"
                      : "border-ink-600 text-ink-200 hover:border-cyan-400/50 hover:text-cyan-200"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        {size && (
          <p className="mt-2 font-mono text-[10.5px] text-cyan-300">
            размер {size} · в наличии у партнёра
          </p>
        )}
      </motion.div>
    </div>
  );
}

function ApplianceBody({
  extras,
  market,
  partnerFinal,
  partner,
}: {
  extras: NonNullable<ProductPayload["extras"]>;
  market: { retailer: string; price: number };
  partnerFinal: number;
  partner: string;
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-ink-700 bg-ink-950/50 p-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
          ключевые спеки
        </span>
        <ul className="mt-2 space-y-1.5">
          {extras.specs?.map(([k, v]) => (
            <li key={k} className="flex justify-between gap-3 text-[11.5px]">
              <span className="text-ink-500">{k}</span>
              <span className="text-right text-ink-200">{v}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border border-ink-700 bg-ink-950/50 p-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
          предложения на рынке
        </span>
        <ul className="mt-2 space-y-2">
          <li className="flex items-center justify-between gap-2 text-[11.5px] text-ink-400">
            <span className="truncate">{market.retailer}</span>
            <span className="font-mono line-through">{fmtRub(market.price)}</span>
          </li>
          {extras.alt_offers?.map((o) => (
            <li key={o.retailer}>
              <div className="flex items-center justify-between gap-2 text-[11.5px] text-ink-300">
                <span className="truncate">{o.retailer}</span>
                <span className="font-mono">{fmtRub(o.price)}</span>
              </div>
              <p className="font-mono text-[9.5px] text-ink-500">{o.note}</p>
            </li>
          ))}
          <li className="flex items-center justify-between gap-2 border-t border-ink-700 pt-2 text-[11.5px]">
            <span className="text-cyan-300">{partner}</span>
            <span className="font-mono font-bold text-cyan-300">{fmtRub(partnerFinal)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function TvBody({
  extras,
  active,
}: {
  extras: NonNullable<ProductPayload["extras"]>;
  active: boolean;
}) {
  const meter = extras.meter ?? 0;
  return (
    <div className="mt-4 flex items-center gap-5 rounded-lg border border-amber-400/25 bg-amber-400/[0.04] p-4">
      <svg viewBox="0 0 120 68" className="w-28 shrink-0">
        <path d="M12,60 A48,48 0 0 1 108,60" fill="none" stroke="#262b3a" strokeWidth="8" strokeLinecap="round" />
        <motion.path
          d="M12,60 A48,48 0 0 1 108,60"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="8"
          strokeLinecap="round"
          pathLength={1}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: active ? meter / 100 : 0 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
        <text x="60" y="52" textAnchor="middle" className="fill-amber-300 font-mono" fontSize="20" fontWeight="700">
          {meter}%
        </text>
      </svg>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300">
          индекс момента покупки
        </p>
        <p className="mt-1.5 text-[13px] font-semibold text-ink-100">{extras.verdict}</p>
        <p className="mt-1 text-[11px] text-ink-400">
          цена снижается {extras.weeks_down} недель подряд · партнёр добавляет монтаж в подарок
        </p>
      </div>
    </div>
  );
}

/* ---------------- график ---------------- */
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
