import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import type { AgentId } from "../../data/types";
import { fmtRub } from "../../lib/format";
import { IcChat, IcDoc, IcPhone, IcRadar, IcSpark, IcTag } from "./icons";

/* ---------------- Panel ---------------- */
export function Panel({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-ink-700 bg-ink-800/70 ${
        hover
          ? "transition-all duration-300 hover:-translate-y-0.5 hover:border-ink-500 hover:bg-ink-800"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------------- Section label ---------------- */
export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`font-mono text-[11px] uppercase tracking-[0.22em] text-ink-300 ${className}`}
    >
      <span className="mr-2 text-ink-500">//</span>
      {children}
    </div>
  );
}

/* ---------------- Agent identity ---------------- */
export const AGENT_META: Record<
  AgentId,
  { name: string; fg: string; bg: string; bd: string; icon: ReactNode }
> = {
  orchestrator: {
    name: "Оркестратор",
    fg: "text-ink-100",
    bg: "bg-ink-700",
    bd: "border-ink-500",
    icon: <IcSpark />,
  },
  product: {
    name: "Агент Товаров",
    fg: "text-cyan-300",
    bg: "bg-cyan-400/10",
    bd: "border-cyan-400/30",
    icon: <IcTag />,
  },
  tender: {
    name: "Тендерный Агент",
    fg: "text-violet-300",
    bg: "bg-violet-400/10",
    bd: "border-violet-400/30",
    icon: <IcDoc />,
  },
  scout: {
    name: "Разведчик",
    fg: "text-amber-300",
    bg: "bg-amber-400/10",
    bd: "border-amber-400/30",
    icon: <IcRadar />,
  },
  voice: {
    name: "Голосовой ИИ",
    fg: "text-amber-300",
    bg: "bg-amber-400/10",
    bd: "border-amber-400/30",
    icon: <IcPhone />,
  },
  negotiator: {
    name: "Переговорщик",
    fg: "text-amber-300",
    bg: "bg-amber-400/10",
    bd: "border-amber-400/30",
    icon: <IcChat />,
  },
};

export function AgentBadge({
  agent,
  showName = true,
  size = "md",
}: {
  agent: AgentId;
  showName?: boolean;
  size?: "sm" | "md";
}) {
  const m = AGENT_META[agent];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${m.bg} ${m.bd} ${m.fg} ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-[11px]"
      } font-mono uppercase tracking-wider`}
    >
      <span className={size === "sm" ? "text-[11px]" : "text-[13px]"}>
        {m.icon}
      </span>
      {showName && m.name}
    </span>
  );
}

/* ---------------- Live dot ---------------- */
export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block h-1.5 w-1.5 ${className}`}>
      <span className="ring-ping absolute inset-0 rounded-full" />
      <span className="acc-bg absolute inset-0 rounded-full" />
    </span>
  );
}

/* ---------------- Count-up money ---------------- */
export function useCountUp(target: number, active: boolean, duration = 900) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(Math.round(target * eased));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, active, duration]);
  return v;
}

export function Money({
  value,
  active = true,
  className = "",
  duration = 900,
}: {
  value: number;
  active?: boolean;
  className?: string;
  duration?: number;
}) {
  const v = useCountUp(value, active, duration);
  return <span className={className}>{fmtRub(v)}</span>;
}

/* ---------------- Image with offline-safe fallback ---------------- */
export function MediaImg({
  src,
  alt,
  className = "",
  icon,
}: {
  src: string;
  alt: string;
  className?: string;
  icon?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#1b1f2b,#0e1016_70%)] ${className}`}
      >
        <div className="flex flex-col items-center gap-2 text-ink-500">
          <span className="text-3xl">{icon ?? <IcSpark />}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
            visual feed
          </span>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/* ---------------- Stat ---------------- */
export function Stat({
  value,
  label,
  accent = false,
}: {
  value: ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`font-mono text-xl font-bold sm:text-2xl ${
          accent ? "acc-text acc-anim" : "text-ink-50"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-[0.18em] text-ink-400">
        {label}
      </span>
    </div>
  );
}

/* ---------------- Motion preset ---------------- */
export const rise = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Reveal({
  children,
  i = 0,
  className = "",
}: {
  children: ReactNode;
  i?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={rise}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      custom={i}
    >
      {children}
    </motion.div>
  );
}
