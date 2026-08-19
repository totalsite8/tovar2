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
    { agent: "scout", text: "нашёл 12 новых оконных подрядчиков в Академическом" },
    { agent: "voice", text: "квалифицировал бригаду монтажников за 51 с звонка" },
    { agent: "product", text: "кэшбек-маршрут #A-114 выплатил 2 584 ₽" },
    { agent: "tender", text: "ТЗ #2041 принято подрядчиком без правок" },
    { agent: "scout", text: "«ОкнаСтрой» открыл Smart-Link · 12 с на странице" },
    { agent: "tender", text: "эскроу раскрыт · работа #1987 принята пользователем" },
  ];

const LEDGER = [
  {
    n: "01",
    title: "Холодный старт — решён",
    body: "Подрядчиков нет в базе? ИИ-армия сканирует 2ГИС и Яндекс Карты, звонит бригадам голосовым ИИ и собирает отклики в WhatsApp — без регистрации с их стороны.",
    icon: <IcBolt />,
    tint: "text-amber-300",
  },
  {
    n: "02",
    title: "Доверие — инженерно",
    body: "Каждый отклик нормализуется: скрытые доплаты наружу, гарантия взвешена, споры проверены. Деньги сидят в эскроу, пока вы не подпишете акт.",
    icon: <IcShield />,
    tint: "text-violet-300",
  },
  {
    n: "03",
    title: "Честная математика",
    body: "Агент Товаров показывает сырой рыночный пол — и бьёт его: цена партнёра минус кэшбек Aura, посчитанная на ваших глазах.",
    icon: <IcWallet />,
    tint: "text-cyan-300",
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
    <div className="grid gap-6 lg:grid-cols-12">
      {/* ---- слева: манифест ---- */}
      <div className="flex flex-col justify-between gap-10 lg:col-span-7">
        <div>
          <Reveal>
            <SectionLabel>сессия 0426 · оркестратор в сети</SectionLabel>
          </Reveal>
          <h1 className="mt-5 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] font-semibold tracking-tight text-ink-50">
            {["Три агента.", "Один честный", "ответ."].map((l, i) => (
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
                      Один <span className="text-cyan-300">честный</span>
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
              Aura направляет одно предложение специализированным агентам,
              которые покупают, торгуются и проверяют за вас — и показывают
              работу в реальном времени, чтобы доверие возникло на экране, а не
              на словах.
            </p>
          </Reveal>
        </div>

        <Reveal i={4}>
          <div className="grid grid-cols-2 gap-6 border-t border-ink-700 pt-6 sm:grid-cols-4">
            <Stat value="3/3" label="агентов в сети" accent />
            <Stat value="11,2%" label="медианная экономия" />
            <Stat value="3 мин 40 с" label="до первого отклика" />
            <Stat value="4,2 млн ₽" label="сейчас в эскроу" />
          </div>
        </Reveal>
      </div>

      {/* ---- справа: каналы агентов ---- */}
      <div className="flex flex-col gap-4 lg:col-span-5">
        <Reveal i={2}>
          <Panel hover className="group relative overflow-hidden p-5">
            <div className="absolute inset-y-0 left-0 w-[3px] bg-cyan-400/70" />
            <div className="flex items-center justify-between">
              <AgentBadge agent="product" />
              <LiveDot className="text-cyan-300" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink-50">
              Честный Выбор
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
              Рыночный пол против партнёра с кэшбеком — математика всегда
              открыта, ничего не прячем.
            </p>
            <button
              onClick={() => queueIntent("самые дешёвые AirPods Pro 3")}
              className="mt-4 inline-flex w-full items-center justify-between rounded-lg border border-cyan-400/25 bg-cyan-400/5 px-3.5 py-2.5 text-left text-[13px] text-cyan-100 transition-all duration-200 hover:translate-x-1 hover:border-cyan-300/60 hover:bg-cyan-400/10"
            >
              <span className="font-mono">самые дешёвые AirPods Pro 3…</span>
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
              Решатель Услуг
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
              Одно сообщение превращается в ТЗ, живые торги и ранжированные
              отклики — с ИИ-армией на холодном старте.
            </p>
            <button
              onClick={() => queueIntent("заменить 3 окна под ключ")}
              className="mt-4 inline-flex w-full items-center justify-between rounded-lg border border-violet-400/25 bg-violet-400/5 px-3.5 py-2.5 text-left text-[13px] text-violet-100 transition-all duration-200 hover:translate-x-1 hover:border-violet-300/60 hover:bg-violet-400/10"
            >
              <span className="font-mono">заменить 3 окна под ключ</span>
              <IcArrow className="text-violet-300" />
            </button>
          </Panel>
        </Reveal>

        {/* провод оркестратора */}
        <Reveal i={4}>
          <Panel className="flex items-center gap-3 px-4 py-3">
            <span className="shrink-0 text-amber-300">
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
                        ? "text-cyan-300"
                        : line.agent === "tender"
                          ? "text-violet-300"
                          : "text-amber-300"
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

      {/* ---- журнал запросов пользователя ---- */}
      {sessions.length > 0 && (
        <Reveal className="lg:col-span-12">
          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <SectionLabel>ваши запросы</SectionLabel>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500">
                клик — вернуться к сессии
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sessions.slice(-5).reverse().map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSession(s.id)}
                  className={`group flex items-center gap-2.5 rounded-full border px-4 py-2 text-[12.5px] transition-all duration-200 hover:-translate-y-0.5 ${
                    s.mode === "product"
                      ? "border-cyan-400/25 bg-cyan-400/5 text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-400/10"
                      : "border-violet-400/25 bg-violet-400/5 text-violet-100 hover:border-violet-300/60 hover:bg-violet-400/10"
                  } ${s.id === activeId ? "ring-1 ring-current" : ""}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.mode === "product" ? "bg-cyan-300" : "bg-violet-300"
                    }`}
                  />
                  «{s.query}»
                  <span
                    className={`font-mono text-[9px] uppercase tracking-wider ${
                      s.mode === "product" ? "text-cyan-300/70" : "text-violet-300/70"
                    }`}
                  >
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

      {/* ---- почему агенты выигрывают ---- */}
      <Reveal className="lg:col-span-12">
        <div className="mt-2">
          <SectionLabel className="mb-4">почему агенты выигрывают</SectionLabel>
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
