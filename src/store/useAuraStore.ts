import { create } from "zustand";
import type { RoutedMode } from "../lib/intent";

export type AppMode = "idle" | RoutedMode;

export interface Toast {
  id: number;
  msg: string;
  tone: "cyan" | "violet" | "amber" | "slate";
}

/** Один запрос пользователя = одна сессия, по ним можно перемещаться. */
export interface Session {
  id: string;
  query: string;
  mode: RoutedMode;
  productId?: string;
  createdAt: number;
  claimed?: boolean;
  orderId?: string;
  secured?: boolean;
}

interface AuraState {
  mode: AppMode;
  query: string;
  sessions: Session[];
  activeId: string | null;
  drawerOpen: boolean;
  pendingIntent: string | null;
  sessionSeed: number;
  toasts: Toast[];

  activate: (mode: RoutedMode, query: string, productId?: string) => void;
  goHome: () => void;
  selectSession: (id: string) => void;
  stepSession: (dir: 1 | -1) => void;
  setActiveProduct: (productId?: string) => void;
  patchActive: (patch: Partial<Session>) => void;
  setDrawer: (open: boolean) => void;
  queueIntent: (text: string) => void;
  clearPending: () => void;
  replaySession: () => void;
  pushToast: (msg: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;
let sessionSeq = 0;

export const useAuraStore = create<AuraState>((set, get) => ({
  mode: "idle",
  query: "",
  sessions: [],
  activeId: null,
  drawerOpen: false,
  pendingIntent: null,
  sessionSeed: 0,
  toasts: [],

  activate: (mode, query, productId) => {
    const existing = get().sessions.find((s) => s.query === query);
    if (existing) {
      set({
        mode,
        query,
        activeId: existing.id,
        sessions: get().sessions.map((s) =>
          s.id === existing.id && productId ? { ...s, productId } : s
        ),
      });
      get().pushToast("Вернулись к сессии с этим запросом", mode === "product" ? "cyan" : "violet");
      return;
    }
    const id = `s${++sessionSeq}-${Date.now().toString(36)}`;
    const session: Session = { id, query, mode, productId, createdAt: Date.now() };
    set((s) => ({
      mode,
      query,
      activeId: id,
      sessions: [...s.sessions, session],
    }));
    get().pushToast(
      mode === "product"
        ? "Агент Товаров подключился · считаю честно"
        : "Тендерный Агент подключился · ТЗ → торги → отклики",
      mode === "product" ? "cyan" : "violet"
    );
  },

  goHome: () => set({ mode: "idle", query: "", drawerOpen: false }),

  selectSession: (id) => {
    const s = get().sessions.find((x) => x.id === id);
    if (!s) return;
    set({
      activeId: id,
      mode: s.mode,
      query: s.query,
      drawerOpen: false,
    });
  },

  stepSession: (dir) => {
    const { sessions, activeId } = get();
    if (sessions.length === 0) return;
    const idx = sessions.findIndex((s) => s.id === activeId);
    const next = Math.min(sessions.length - 1, Math.max(0, idx + dir));
    if (next !== idx) get().selectSession(sessions[next].id);
  },

  setActiveProduct: (productId) => {
    const { activeId } = get();
    if (!activeId) return;
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === activeId ? { ...x, productId } : x
      ),
    }));
  },

  patchActive: (patch) => {
    const { activeId } = get();
    if (!activeId) return;
    set((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === activeId ? { ...x, ...patch } : x
      ),
    }));
  },

  setDrawer: (open) => set({ drawerOpen: open }),

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
