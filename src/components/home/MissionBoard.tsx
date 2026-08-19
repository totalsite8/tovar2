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
import { HeroScene } from "./HeroScene";
import { IcArrow, IcBolt, IcShield, IcWallet } from "../shared/icons";

const WIRE: { agent: "scout" | "voice" | "product" | "tender"; text: string }[] =
  [
    { agent: "scout", text: "нашёл 12 новых оконных подрядчиков в Академическом" },
    { agent: "voice", text: "квалифицировал бригаду монтажников за 51 с звонка" },
    { agent: "product", text: "кэшбек-маршрут #A-114 выплатил 2 584 ₽" },
    { agent: "tender", text: "ТЗ #2041 принято подрядчиком без правок" },
    { agent: "scout", text: "«ОкнаСтрой» открыл Smart-Link · 12 с на странице" },
    { agent: "tender", text: "эскроу раскрыт · работа #1987 принята пользователем" },
  ];

/* компактные продающие преимущества — строками, не карточками */
const WINS: {
  n: string;
  icon: React.ReactNode;
  tint: string;
  claim: string;
  body: string;
  stat: string;
}[] = [
  {
    n: "01",
    icon: <IcWallet />,
    tint: "text-[#12857a] bg-[#12857a]/10",
    claim: "Кэшбек бьёт рыночное дно",
    body: "Партнёрская цена минус кэшбек Aura: 23 490 − 2 584 = 20 906 ₽ — ниже самого дешёвого маркетплейса, с официальной гарантией.",
    stat: "−1 084 ₽ с покупки",
  },
  {
    n: "02",
    icon: <IcBolt />,
    tint: "text-[#c9871b] bg-[#e8a33d]/15",
    claim: "Подрядчики находятся сами",
    body: "ИИ-армия сканирует 2ГИС и Яндекс Карты, звонит бригадам голосом и собирает отклики в WhatsApp — подрядчикам не нужно регистрироваться.",
    stat: "первый отклик ~3 мин 40 с",
  },
  {
    n: "03",
    icon: <IcShield />,
    tint: "text-[#6d5fd0] bg-[#6d5fd0]/10",
    claim: "Деньги в безопасности до приёмки",
    body: "Эскроу замораживает оплату: подрядчик получает её только после акта, который подписываете вы. Спор — арбитраж Aura за 24 часа.",
    stat: "0 ₽ риска",
  },
];

export function MissionBoard() {
  const { queueIntent, sessions, selectSession, activeId } = useAuraStore();
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
    <div className="space-y-8">
      {/* ---- живой hero: процесс подбора ---- */}
      <Reveal>
        <HeroScene />
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* ---- слева: преимущества + метрики ---- */}
        <div className="lg:col-span-7">
          <Reveal>
            <SectionLabel>почему это выгодно</SectionLabel>
          </Reveal>
          <div className="mt-3 divide-y divide-ink-700 border-y border-ink-700">
            {WINS.map((w, i) => (
              <Reveal key={w.n} i={i}>
                <div className="group flex items-start gap-4 py-4 transition-all duration-300 hover:bg-ink-850 hover:pl-2 sm:gap-5">
                  <span className="font-display text-xl font-bold text-ink-500/70 transition-colors group-hover:text-ink-300">
                    {w.n}
                  </span>
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border-[1.5px] border-ink-50 text-base shadow-[2px_2px_0_#211b14] transition-transform duration-300 group-hover:-rotate-6 ${w.tint}`}
                  >
                    {w.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-[15px] font-semibold text-ink-50">
                      {w.claim}
                    </h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-300">
                      {w.body}
                    </p>
                  </div>
                  <span className="mt-1 hidden shrink-0 rounded-full border-[1.5px] border-ink-50 bg-paper px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-200 shadow-[2px_2px_0_#211b14] transition-transform duration-300 group-hover:translate-x-1 sm:inline-block">
                    {w.stat}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal i={3}>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat value="3/3" label="агентов в сети" accent />
              <Stat value="11,2%" label="медианная экономия" />
              <Stat value="3 мин 40 с" label="до первого отклика" />
              <Stat value="4,2 млн ₽" label="сейчас в эскроу" />
            </div>
          </Reveal>
        </div>

        {/* ---- справа: каналы агентов ---- */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Reveal i={1}>
            <Panel hover className="group relative overflow-hidden rounded-[20px] border-[1.5px] border-ink-50 p-5 shadow-[4px_4px_0_#211b14]">
              <div className="absolute inset-y-0 left-0 w-[4px] bg-[#12857a]" />
              <div className="flex items-center justify-between">
                <AgentBadge agent="product" />
                <LiveDot className="text-[#12857a]" />
              </div>
              <h3 className="mt-4 font-display text-[17px] font-semibold text-ink-50">
                Честный Выбор
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                Рыночный пол против партнёра с кэшбеком — вся математика на
                экране, ничего не прячем.
              </p>
              <button
                onClick={() => queueIntent("самые дешёвые AirPods Pro 3")}
                className="sticker mt-4 inline-flex w-full items-center justify-between rounded-[12px] bg-[#12857a]/10 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-[#0e6e62]"
              >
                <span className="font-mono">самые дешёвые AirPods Pro 3…</span>
                <IcArrow className="transition-transform group-hover:translate-x-1" />
              </button>
            </Panel>
          </Reveal>

          <Reveal i={2}>
            <Panel hover className="group relative overflow-hidden rounded-[20px] border-[1.5px] border-ink-50 p-5 shadow-[4px_4px_0_#211b14]">
              <div className="absolute inset-y-0 left-0 w-[4px] bg-[#6d5fd0]" />
              <div className="flex items-center justify-between">
                <AgentBadge agent="tender" />
                <LiveDot className="text-[#6d5fd0]" />
              </div>
              <h3 className="mt-4 font-display text-[17px] font-semibold text-ink-50">
                Решатель Услуг
              </h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                Одно сообщение → ТЗ, живые торги и ранжированные отклики. С
                ИИ-армией на холодном старте.
              </p>
              <button
                onClick={() => queueIntent("заменить 3 окна под ключ")}
                className="sticker mt-4 inline-flex w-full items-center justify-between rounded-[12px] bg-[#6d5fd0]/10 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-[#5a4ebd]"
              >
                <span className="font-mono">заменить 3 окна под ключ</span>
                <IcArrow className="transition-transform group-hover:translate-x-1" />
              </button>
            </Panel>
          </Reveal>

          <Reveal i={3}>
            <Panel className="flex items-center gap-3 rounded-[16px] border-[1.5px] border-ink-50 px-4 py-3 shadow-[3px_3px_0_#211b14]">
              <span className="shrink-0 text-[#c9871b]">
                <IcBolt />
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                провод
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
                          ? "text-[#12857a]"
                          : line.agent === "tender"
                            ? "text-[#6d5fd0]"
                            : "text-[#c9871b]"
                      }
                    >
                      {line.agent === "product"
                        ? "агент товаров"
                        : line.agent === "tender"
                          ? "тендерный"
                          : line.agent}
                    </span>{" "}
                    {line.text}
                  </motion.span>
                </AnimatePresence>
              </div>
            </Panel>
          </Reveal>
        </div>
      </div>

      {/* ---- запросы пользователя ---- */}
      {sessions.length > 0 && (
        <Reveal>
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <SectionLabel>ваши запросы</SectionLabel>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                клик — вернуться к сессии
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sessions.slice(-5).reverse().map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`sticker-acc group flex items-center gap-2.5 rounded-full px-4 py-2 text-[12.5px] font-semibold ${
                    s.mode === "product"
                      ? "bg-[#12857a]/10 text-[#0e6e62]"
                      : "bg-[#6d5fd0]/10 text-[#5a4ebd]"
                  } ${s.id === activeId ? "ring-2 ring-ink-50" : ""}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.mode === "product" ? "bg-[#12857a]" : "bg-[#6d5fd0]"
                    }`}
                  />
                  «{s.query}»
                  <span className="font-mono text-[9px] uppercase tracking-wider opacity-70">
                    {s.mode === "product"
                      ? s.claimed
                        ? "кэшбек ✓"
                        : "товары"
                      : s.secured
                        ? "эскроу ✓"
                        : "услуги"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
