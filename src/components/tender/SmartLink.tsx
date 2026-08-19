import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { TenderPayload } from "../../data/types";
import { useAuraStore } from "../../store/useAuraStore";
import { fmtRub } from "../../lib/format";
import { MediaImg, SectionLabel } from "../shared/Primitives";
import { IcChevron, IcDoc, IcLink, IcPin } from "../shared/icons";

export function SmartLink({ tender }: { tender: TenderPayload }) {
  const [open, setOpen] = useState(true);
  const [price, setPrice] = useState("");
  const pushToast = useAuraStore((s) => s.pushToast);

  function send() {
    const v = parseInt(price.replace(/\D/g, ""), 10);
    if (!v || v < 1000) {
      pushToast("Демо: подрядчик вводит одно число — вся форма целиком", "amber");
      return;
    }
    pushToast(`Демо: отклик ${fmtRub(v)} получен через Smart-Link`, "violet");
    setPrice("");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-amber-400/25 bg-ink-800/70">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-ink-700/40"
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-300">
            <IcLink />
          </span>
          <div>
            <SectionLabel className="text-amber-300/90">
              смарт-ссылка · глазами подрядчика
            </SectionLabel>
            <p className="mt-0.5 text-xs text-ink-300">
              ровно то, что открывает подрядчик — без приложения и регистрации
            </p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          className="text-ink-400"
        >
          <IcChevron />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid gap-4 border-t border-ink-700 p-5 sm:grid-cols-[1fr_260px]">
              <div>
                <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-950/60 px-3 py-2 font-mono text-xs text-ink-200">
                  <span className="text-amber-300">
                    <IcLink />
                  </span>
                  https://{tender.smartlink.url}
                  <span className="ml-auto rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-amber-300">
                    1 поле
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-xs text-ink-300">
                  <li className="flex items-center gap-2">
                    <IcPin className="shrink-0 text-amber-300" />
                    {tender.smartlink.open_rate}
                  </li>
                  <li className="flex items-center gap-2">
                    <IcDoc className="shrink-0 text-amber-300" />
                    {tender.smartlink.median_response}
                  </li>
                </ul>
                <p className="mt-4 border-l-2 border-amber-400/50 pl-3 text-[12px] leading-relaxed text-ink-400">
                  Подрядчики никогда не регистрируются. В ссылке — ТЗ, фото и
                  одно поле цены; отклик сам прилетает в таблицу сравнения.
                </p>
              </div>

              <div className="rounded-xl border border-ink-600 bg-ink-950 p-3">
                <div className="flex items-center justify-between px-1 font-mono text-[9px] uppercase tracking-widest text-ink-500">
                  <span>aura · смарт-ссылка</span>
                  <span className="text-amber-300">защита</span>
                </div>
                <MediaImg
                  src={tender.photo}
                  alt="оконный проём"
                  icon={<IcDoc />}
                  className="mt-2 h-28 w-full rounded-lg object-cover"
                />
                <p className="mt-2.5 px-1 text-xs font-semibold text-ink-100">
                  {tender.title}
                </p>
                <p className="px-1 font-mono text-[9.5px] text-ink-500">
                  {tender.spec[0]}
                </p>
                <div className="mt-2.5 flex gap-1.5 px-1">
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="numeric"
                    placeholder="Ваша цена, ₽"
                    className="min-w-0 flex-1 rounded-md border border-ink-600 bg-ink-850 px-2 py-1.5 font-mono text-[11px] text-ink-100 outline-none placeholder:text-ink-500 focus:border-amber-400/60"
                  />
                  <button
                    onClick={send}
                    className="rounded-md bg-amber-300 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-950 transition-all hover:bg-amber-200 active:scale-95"
                  >
                    отклик
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
