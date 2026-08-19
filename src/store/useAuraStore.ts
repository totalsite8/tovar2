import { create } from "zustand";
import type { RoutedMode } from "../lib/intent";

export type AppMode = "idle" | RoutedMode;

export interface Toast {
  id: number;
  msg: string;
  tone: "cyan" | "violet" | "amber" | "slate";
}

interface AuraState {
  mode: AppMode;
  query: string;
  /** intent queued from the mission board → omnibar executes it */
  pendingIntent: string | null;
  sessionSeed: number;
  toasts: Toast[];
  activate: (mode: RoutedMode, query: string) => void;
  goHome: () => void;
  queueIntent: (text: string) => void;
  clearPending: () => void;
  replaySession: () => void;
  pushToast: (msg: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useAuraStore = create<AuraState>((set, get) => ({
  mode: "idle",
  query: "",
  pendingIntent: null,
  sessionSeed: 0,
  toasts: [],

  activate: (mode, query) => {
    set({ mode, query });
    get().pushToast(
      mode === "product"
        ? "Product Agent engaged · building honest ranking"
        : "Tender Agent engaged · spec → field ops → bids",
      mode === "product" ? "cyan" : "violet"
    );
  },

  goHome: () => set({ mode: "idle", query: "" }),

  queueIntent: (text) => set({ pendingIntent: text }),
  clearPending: () => set({ pendingIntent: null }),

  replaySession: () => set((s) => ({ sessionSeed: s.sessionSeed + 1 })),

  pushToast: (msg, tone = "slate") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, msg, tone }] }));
    setTimeout(() => get().dismissToast(id), 3800);
  },

  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
