import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuraStore } from "../../store/useAuraStore";
import { SectionLabel } from "../shared/Primitives";
import { IcArrow, IcChat, IcTag, IcX } from "../shared/icons";

function statusOf(s: { mode: string; claimed?: boolean; secured?: boolean }) {
  if (s.mode === "product") {
    return s.claimed
      ? { label: "кэшбек получен", cls: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" }
      : { label: "готово к покупке", cls: "border-ink-600 bg-ink-700/50 text-ink-300" };
  }
  return s.secured
    ? { label: "эскроу открыт", cls: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" }
    : { label: "торги завершены", cls: "border-violet-400/40 bg-violet-400/10 text-violet-300" };
}

export function SessionDrawer() {
  const { drawerOpen, setDrawer, sessions, activeId, selectSession } =
    useAuraStore();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawer]);

  const time = (ts: number) =>
    new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink-950/80"
            onClick={() => setDrawer(false)}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-ink-700 bg-ink-900"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div className="flex items-center justify-between border-b border-ink-700 px-5 py-4">
              <div>
                <SectionLabel>журнал запросов</SectionLabel>
                <p className="mt-1 text-sm text-ink-200">
                  {sessions.length}{" "}
                  {sessions.length === 1 ? "запрос" : sessions.length < 5 ? "запроса" : "запросов"} · сессия 0426
                </p>
              </div>
              <button
                onClick={() => setDrawer(false)}
                className="rounded-md border border-ink-600 p-2 text-ink-300 transition-colors hover:border-ink-400 hover:text-ink-50"
                aria-label="Закрыть журнал"
              >
                <IcX />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {sessions.length === 0 ? (
                <p className="mt-10 text-center font-mono text-xs leading-relaxed text-ink-500">
                  пока пусто.
                  <br />
                  отправьте запрос через омнибар —<br />
                  он появится здесь.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {[...sessions].reverse().map((s) => {
                    const active = s.id === activeId;
                    const st = statusOf(s);
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => selectSession(s.id)}
                          className={`group w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                            active
                              ? s.mode === "product"
                                ? "border-cyan-400/50 bg-cyan-400/[0.07] shadow-[0_0_30px_-14px_rgba(103,232,249,0.6)]"
                                : "border-violet-400/50 bg-violet-400/[0.07] shadow-[0_0_30px_-14px_rgba(167,139,250,0.6)]"
                              : "border-ink-700 bg-ink-850/70 hover:border-ink-500 hover:bg-ink-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm ${
                                s.mode === "product"
                                  ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
                                  : "border-violet-400/40 bg-violet-400/10 text-violet-300"
                              }`}
                            >
                              {s.mode === "product" ? <IcTag /> : <IcChat />}
                            </span>
                            <span
                              className={`font-mono text-[10px] uppercase tracking-wider ${
                                s.mode === "product" ? "text-cyan-300" : "text-violet-300"
                              }`}
                            >
                              {s.mode === "product" ? "агент товаров" : "тендерный агент"}
                            </span>
                            <span className="ml-auto font-mono text-[10px] text-ink-500">
                              {time(s.createdAt)}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-[13.5px] font-medium text-ink-100">
                            «{s.query}»
                          </p>
                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`rounded border px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-wider ${st.cls}`}
                            >
                              {st.label}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px] text-ink-500 transition-colors group-hover:text-ink-200">
                              открыть <IcArrow className="transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="border-t border-ink-700 px-5 py-3.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-500" style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}>
              esc — закрыть · клик — вернуться к запросу
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
