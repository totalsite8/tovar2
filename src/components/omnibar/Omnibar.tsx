import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { detectIntent, matchProductId, ROUTE_STEPS } from "../../lib/intent";
import { useAuraStore } from "../../store/useAuraStore";
import { IcArrow, IcBolt, IcSpark } from "../shared/icons";

/* подсказки кликабельны: ведут прямо на конкретный просчёт */
const SUGGESTIONS: {
  text: string;
  mode: "product" | "tender";
  productId?: string;
  tag: string;
}[] = [
  { text: "самые дешёвые AirPods Pro 3", mode: "product", productId: "airpods-pro-3", tag: "расчёт · −1 084 ₽" },
  { text: "кроссовки ASICS для марафона", mode: "product", productId: "asics-kayano-31", tag: "расчёт · −919 ₽" },
  { text: "робот-пылесос с самоочисткой", mode: "product", productId: "roborock-s8", tag: "расчёт · −999 ₽" },
  { text: "OLED 55″ — момент покупки", mode: "product", productId: "lg-oled-c4", tag: "расчёт · −1 199 ₽" },
  { text: "заменить 3 окна под ключ", mode: "tender", tag: "живые торги · 4 отклика" },
];

export function Omnibar() {
  const { pendingIntent, clearPending, activate, pushToast } = useAuraStore();
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [routeStep, setRouteStep] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  const intent = useMemo(() => detectIntent(value), [value]);
  const accent = intent
    ? intent.mode === "product"
      ? "cyan"
      : "violet"
    : "neutral";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  /* доска миссий ставит запрос в очередь → омнибар печатает и запускает его */
  useEffect(() => {
    if (!pendingIntent) return;
    setValue(pendingIntent);
    setFocused(true);
    const text = pendingIntent;
    clearPending();
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      submit(text);
    }, 420);
    timers.current.push(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingIntent]);

  function runRoute(mode: "product" | "tender", q: string, productId?: string) {
    const steps = ROUTE_STEPS[mode];
    setRouteStep(0);
    steps.forEach((_, i) => {
      if (i === 0) return;
      timers.current.push(window.setTimeout(() => setRouteStep(i), i * 640));
    });
    timers.current.push(
      window.setTimeout(() => {
        activate(mode, q, productId);
        setRouteStep(null);
        setValue("");
        setFocused(false);
        inputRef.current?.blur();
      }, steps.length * 640 + 320)
    );
  }

  function submit(raw?: string) {
    const q = (raw ?? value).trim();
    if (routeStep !== null || q.length === 0) return;
    const res = detectIntent(q);
    if (!res) {
      setShake((s) => s + 1);
      pushToast("Намерение не ясно — попробуйте «купить …» или «установить …»", "amber");
      return;
    }
    runRoute(
      res.mode,
      q,
      res.mode === "product" ? matchProductId(q) : undefined
    );
  }

  const expanded = focused || value.length > 0 || routeStep !== null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="h-10 bg-gradient-to-t from-ink-950 to-transparent" />
      <div
        className="px-3 sm:px-6"
        style={{ paddingBottom: "max(14px, env(safe-area-inset-bottom))" }}
      >
        <div
          data-accent={accent === "neutral" ? undefined : accent}
          className={`pointer-events-auto relative mx-auto max-w-2xl ${
            accent === "neutral" ? "" : "acc-anim"
          }`}
        >
          <motion.div
            animate={shake ? { x: [0, -9, 9, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            key={shake}
            className={`rounded-[20px] border-[1.5px] bg-ink-800/95 transition-all duration-500 ${
              accent === "neutral"
                ? "border-ink-50 shadow-[0_24px_50px_-20px_rgba(33,27,20,0.45)]"
                : "acc-border acc-ring"
            }`}
          >
            <AnimatePresence mode="wait">
              {routeStep !== null && intent ? (
                <motion.div
                  key="routing"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="px-5 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="acc-text text-lg">
                      <IcBolt />
                    </span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={routeStep}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="acc-text acc-anim font-mono text-sm"
                      >
                        {ROUTE_STEPS[intent.mode][routeStep]}
                        <span className="caret ml-1 inline-block h-3.5 w-[7px] translate-y-0.5 bg-current" />
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="mt-3 h-[4px] overflow-hidden rounded-full bg-ink-700">
                    <div className="shimmer-bar h-full w-full rounded-full" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <span
                      className={`shrink-0 text-lg transition-colors duration-500 ${
                        accent === "neutral" ? "text-ink-400" : "acc-text"
                      }`}
                    >
                      <IcSpark />
                    </span>
                    <input
                      ref={inputRef}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                        if (e.key === "Escape") {
                          setValue("");
                          inputRef.current?.blur();
                          setFocused(false);
                        }
                      }}
                      placeholder="Спросите Aura — купить что угодно, починить что угодно…"
                      className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink-50 outline-none placeholder:text-ink-400"
                      aria-label="Запрос к Aura"
                    />
                    <AnimatePresence>
                      {intent && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="acc-soft acc-text acc-anim hidden shrink-0 items-center gap-1.5 rounded-md border acc-border px-2 py-1 font-mono text-[10px] uppercase tracking-wider sm:inline-flex"
                        >
                          → {intent.label} · {Math.round(intent.confidence * 100)}%
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <button
                      onClick={() => submit()}
                      disabled={!intent}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-all duration-300 ${
                        intent
                          ? "acc-bg text-paper acc-glow hover:scale-105 active:scale-95"
                          : "cursor-default bg-ink-700 text-ink-400"
                      }`}
                      aria-label="Отправить запрос"
                    >
                      <IcArrow />
                    </button>
                  </div>

                  <AnimatePresence>
                    {expanded && value.length === 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap items-center gap-2 border-t border-ink-700 px-4 py-3 sm:px-5">
                          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">
                            готовый просчёт:
                          </span>
                          {SUGGESTIONS.map((s) => (
                            <button
                              key={s.text}
                              onClick={() => runRoute(s.mode, s.text, s.productId)}
                              className={`sticker-acc group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 hover:-translate-y-px ${
                                s.mode === "product"
                                  ? "bg-[#12857a]/10 text-[#0e6e62]"
                                  : "bg-[#6d5fd0]/10 text-[#5a4ebd]"
                              }`}
                            >
                              {s.text}
                              <span className="rounded-full bg-paper px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-wider text-ink-300">
                                {s.tag}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.24em] text-ink-400">
            омнибар · маршрутизатор намерений · enter — отправить
          </div>
        </div>
      </div>
    </div>
  );
}
