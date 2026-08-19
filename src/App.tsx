import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuraStore, type Toast } from "./store/useAuraStore";
import { Omnibar } from "./components/omnibar/Omnibar";
import { MissionBoard } from "./components/home/MissionBoard";
import { ProductRoom } from "./components/product/ProductRoom";
import { TenderRoom } from "./components/tender/TenderRoom";
import { SessionDrawer } from "./components/sessions/SessionDrawer";
import { clock } from "./lib/format";
import { IcDoc, IcTag } from "./components/shared/icons";

/* ---------------- живой фон ---------------- */
function BackgroundFX() {
  const particles = [
    { left: "12%", top: "68%", delay: "0s", size: 3 },
    { left: "26%", top: "82%", delay: "2.4s", size: 2 },
    { left: "55%", top: "76%", delay: "4.1s", size: 3 },
    { left: "71%", top: "85%", delay: "1.2s", size: 2 },
    { left: "84%", top: "64%", delay: "3.3s", size: 3 },
    { left: "40%", top: "90%", delay: "5.2s", size: 2 },
  ];
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="acc-anim absolute inset-x-0 top-[-20%] h-[70%]"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 50% 0%, rgb(var(--acc-rgb) / 0.075), transparent 70%)",
          }}
        />
        <div
          className="absolute right-[-15%] top-[30%] h-[60%] w-[55%]"
          style={{
            background:
              "radial-gradient(circle at 70% 40%, rgb(167 139 250 / 0.05), transparent 65%)",
          }}
        />
        <div
          className="absolute bottom-[-25%] left-[-10%] h-[60%] w-[50%]"
          style={{
            background:
              "radial-gradient(circle at 30% 70%, rgb(103 232 249 / 0.045), transparent 65%)",
          }}
        />
        <div className="bg-grid absolute inset-0" />
        {particles.map((p, i) => (
          <span
            key={i}
            className="acc-bg acc-anim absolute rounded-full opacity-0"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animation: `drift ${14 + i * 3}s linear ${p.delay} infinite`,
            }}
          />
        ))}
      </div>
      <div className="noise pointer-events-none fixed inset-0 z-[60] opacity-[0.05]" />
    </>
  );
}

/* ---------------- шапка ---------------- */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden font-mono text-xs text-ink-300 sm:inline">
      {clock(now)}
    </span>
  );
}

function Wordmark() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <rect width="32" height="32" rx="7" fill="#12141c" stroke="#262b3a" />
        <path
          d="M9.5 23.5 16 8l6.5 15.5"
          fill="none"
          strokeWidth="2.4"
          strokeLinecap="round"
          stroke="url(#wm)"
        />
        <defs>
          <linearGradient id="wm" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="7" r="1.6" fill="#fbbf24" />
      </svg>
      <div className="leading-none">
        <span className="block text-sm font-bold tracking-[0.34em] text-ink-50">
          AURA
        </span>
        <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-ink-400">
          оркестратор 2.6
        </span>
      </div>
    </div>
  );
}

const AGENT_DOTS = [
  { label: "товары", cls: "bg-cyan-300" },
  { label: "тендеры", cls: "bg-violet-300" },
  { label: "армия", cls: "bg-amber-300" },
];

function Chevron({ dir }: { dir: 1 | -1 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: dir === -1 ? "rotate(180deg)" : undefined }}
      aria-hidden
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function Header() {
  const { mode, goHome, sessions, activeId, stepSession, setDrawer } =
    useAuraStore();
  const idx = sessions.findIndex((s) => s.id === activeId);

  return (
    <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur-sm">
      <div
        className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <Wordmark />
        <div className="ml-1 hidden items-center gap-4 lg:flex">
          {AGENT_DOTS.map((a) => (
            <span key={a.label} className="flex items-center gap-1.5">
              <span className={`dot-live h-1.5 w-1.5 rounded-full ${a.cls}`} />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
                {a.label}
              </span>
            </span>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2.5">
          <Clock />

          {sessions.length > 0 && (
            <div className="flex items-center overflow-hidden rounded-md border border-ink-600">
              <button
                onClick={() => stepSession(-1)}
                disabled={idx <= 0}
                className="px-2 py-1.5 text-ink-300 transition-colors hover:bg-ink-700 hover:text-ink-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Предыдущий запрос"
              >
                <Chevron dir={-1} />
              </button>
              <button
                onClick={() => setDrawer(true)}
                className="border-x border-ink-600 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-200 transition-colors hover:bg-ink-700 hover:text-ink-50"
              >
                запросы · {sessions.length}
              </button>
              <button
                onClick={() => stepSession(1)}
                disabled={idx >= sessions.length - 1}
                className="px-2 py-1.5 text-ink-300 transition-colors hover:bg-ink-700 hover:text-ink-50 disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Следующий запрос"
              >
                <Chevron dir={1} />
              </button>
            </div>
          )}

          <AnimatePresence>
            {mode !== "idle" && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={goHome}
                className="rounded-md border border-ink-600 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-200 transition-all hover:border-ink-400 hover:text-ink-50"
              >
                на главную
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/* ---------------- тосты ---------------- */
const TONE_CLS: Record<Toast["tone"], string> = {
  cyan: "border-cyan-400/40 text-cyan-200",
  violet: "border-violet-400/40 text-violet-200",
  amber: "border-amber-400/40 text-amber-200",
  slate: "border-ink-500 text-ink-200",
};

function Toasts() {
  const { toasts, dismissToast } = useAuraStore();
  return (
    <div
      className="pointer-events-none fixed right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      style={{ top: "max(4.2rem, calc(env(safe-area-inset-top) + 3.6rem))" }}
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto rounded-lg border bg-ink-850/95 px-4 py-3 text-left text-xs shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] ${TONE_CLS[t.tone]}`}
          >
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
            {t.msg}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ---------------- приложение ---------------- */
export default function App() {
  const mode = useAuraStore((s) => s.mode);
  const accent =
    mode === "product" ? "cyan" : mode === "tender" ? "violet" : undefined;

  return (
    <div data-accent={accent} className="relative min-h-dvh">
      <BackgroundFX />
      <Header />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-48 sm:px-6">
        <div className="pt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {mode === "idle" && <MissionBoard />}
              {mode === "product" && <ProductRoom />}
              {mode === "tender" && <TenderRoom />}
            </motion.div>
          </AnimatePresence>
        </div>
        <footer className="mt-14 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-ink-800 pt-5 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-ink-500">
          <span className="flex items-center gap-1.5 text-cyan-400/80">
            <IcTag /> честная витрина
          </span>
          <span className="flex items-center gap-1.5 text-violet-400/80">
            <IcDoc /> живые торги
          </span>
          <span>aura mvp 0.9.2 · демо · агенты локально · pwa</span>
        </footer>
      </main>
      <Toasts />
      <SessionDrawer />
      <Omnibar />
    </div>
  );
}
