import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuraStore } from "../../store/useAuraStore";
import { fmtInt, fmtRub } from "../../lib/format";

/* ============================================================
   Живая сцена подбора: агент летит по маршруту магазинов.
   Частицы — WebGPU, если доступен; иначе честный Canvas 2D.
   Клик по сцене — ускорить агента; кнопки магазинов — прыжок.
   ============================================================ */

interface Shop {
  name: string;
  price: number;
  note: string;
  x: number;
  y: number;
  final?: number;
}

const SHOPS: Shop[] = [
  { name: "Ozon Global", price: 21990, note: "серый импорт", x: 0.14, y: 0.62 },
  { name: "DNS", price: 22490, note: "в наличии", x: 0.39, y: 0.34 },
  { name: "М.Видео", price: 23490, note: "официально", x: 0.63, y: 0.62 },
  { name: "Aura Партнёр", price: 23490, note: "кэшбек −2 584 ₽", x: 0.86, y: 0.36, final: 20906 },
];

const NODE_T = [0.08, 0.36, 0.64, 0.93];
const CASHBACK = 2584;
const MARKET_FLOOR = 21990;

type UiPhase = "travel" | "scan" | "success";
interface UiState {
  phase: UiPhase;
  shopIdx: number;
  offers: number;
  found: number[];
}

/* ---------- Catmull-Rom ---------- */
function catmull(pts: { x: number; y: number }[], t: number) {
  const n = pts.length - 1;
  const f = Math.min(n - 0.0001, Math.max(0, t * n));
  const i = Math.floor(f);
  const u = f - i;
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[Math.min(n, i + 1)];
  const p3 = pts[Math.min(n, i + 2)];
  const u2 = u * u;
  const u3 = u2 * u;
  return {
    x:
      0.5 *
      (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3),
    y:
      0.5 *
      (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3),
  };
}

/* ---------- WebGPU слой частиц ---------- */
interface GpuField {
  frame: (w: number, h: number, dt: number, bursts: Burst[]) => void;
  destroy: () => void;
}

interface P {
  x: number; y: number; vx: number; vy: number;
  s: number; r: number; g: number; b: number; a: number;
  life: number; max: number; burst: boolean;
}
interface Burst { x: number; y: number; at: number }

const DUST: [number, number, number][] = [
  [0.07, 0.52, 0.48],
  [0.43, 0.37, 0.82],
  [0.91, 0.64, 0.24],
  [0.95, 0.42, 0.37],
];

function makeParticles(n: number, w: number, h: number): P[] {
  return Array.from({ length: n }, () => {
    const c = DUST[Math.floor(Math.random() * DUST.length)];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 9,
      vy: -6 - Math.random() * 14,
      s: 2 + Math.random() * 4.5,
      r: c[0], g: c[1], b: c[2],
      a: 0.1 + Math.random() * 0.28,
      life: Math.random() * 10,
      max: 10,
      burst: false,
    };
  });
}

function stepParticles(list: P[], dt: number, w: number, h: number, bursts: Burst[]) {
  for (const b of bursts) {
    for (let i = 0; i < 22; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 190;
      const c = DUST[Math.floor(Math.random() * DUST.length)];
      list.push({
        x: b.x, y: b.y,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        s: 2.5 + Math.random() * 4,
        r: c[0], g: c[1], b: c[2],
        a: 0.75, life: 0, max: 0.9, burst: true,
      });
    }
  }
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.burst) {
      p.vx *= 1 - 2.4 * dt;
      p.vy *= 1 - 2.4 * dt;
      p.a = Math.max(0, 0.75 * (1 - p.life / p.max));
      if (p.life >= p.max) list.splice(i, 1);
    } else if (p.y < -12 || p.life > p.max) {
      p.y = h + 10;
      p.x = Math.random() * w;
      p.life = 0;
    }
  }
}

async function initWebGPU(canvas: HTMLCanvasElement): Promise<GpuField | null> {
  try {
    const nav = navigator as Navigator & { gpu?: {
      requestAdapter: () => Promise<any>;
      getPreferredCanvasFormat: () => string;
    } };
    if (!nav.gpu) return null;
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) return null;
    const device: any = await adapter.requestDevice();
    const ctx = canvas.getContext("webgpu") as any;
    if (!ctx) return null;
    const format = nav.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: "premultiplied" });

    const code = `
struct U { res: vec2f, t: f32, pad: f32 };
@group(0) @binding(0) var<uniform> u: U;
struct VOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f, @location(1) color: vec4f };
@vertex fn vs(@builtin(vertex_index) vi: u32,
              @location(0) p: vec2f, @location(1) sz: vec2f, @location(2) color: vec4f) -> VOut {
  var corners = array<vec2f,4>(vec2f(0.,0.), vec2f(1.,0.), vec2f(0.,1.), vec2f(1.,1.));
  let c = corners[vi];
  let px = p + c * sz.x;
  var o: VOut;
  o.pos = vec4f(px / u.res * 2.0 - 1.0, 0.0, 1.0);
  o.pos.y = -o.pos.y;
  o.uv = c * 2.0 - 1.0;
  o.color = color;
  return o;
}
@fragment fn fs(i: VOut) -> @location(0) vec4f {
  let d = length(i.uv);
  let a = smoothstep(1.0, 0.15, d) * i.color.a;
  return vec4f(i.color.rgb * a, a);
}`;
    const module = device.createShaderModule({ code });
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [{
          arrayStride: 32,
          stepMode: "instance",
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
            { shaderLocation: 1, offset: 8, format: "float32x2" },
            { shaderLocation: 2, offset: 16, format: "float32x4" },
          ],
        }],
      },
      fragment: {
        module,
        entryPoint: "fs",
        targets: [{
          format,
          blend: {
            color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
          },
        }],
      },
      primitive: { topology: "triangle-strip" },
    });

    const MAX = 900;
    const USAGE = { VERTEX: 0x20, COPY_DST: 0x8, UNIFORM: 0x40 };
    const instBuf = device.createBuffer({ size: MAX * 32, usage: USAGE.VERTEX | USAGE.COPY_DST });
    const uniformBuf = device.createBuffer({ size: 16, usage: USAGE.UNIFORM | USAGE.COPY_DST });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: uniformBuf } }],
    });
    const data = new Float32Array(MAX * 8);
    const parts: P[] = [];

    return {
      frame(w, h, dt, bursts) {
        if (parts.length === 0) parts.push(...makeParticles(300, w, h));
        stepParticles(parts, dt, w, h, bursts);
        const n = Math.min(MAX, parts.length);
        for (let i = 0; i < n; i++) {
          const p = parts[i];
          const o = i * 8;
          data[o] = p.x - p.s; data[o + 1] = p.y - p.s;
          data[o + 2] = p.s * 2; data[o + 3] = p.s * 2;
          data[o + 4] = p.r; data[o + 5] = p.g; data[o + 6] = p.b; data[o + 7] = p.a;
        }
        device.queue.writeBuffer(instBuf, 0, data.buffer, 0, n * 32);
        device.queue.writeBuffer(uniformBuf, 0, new Float32Array([w, h, performance.now() / 1000, 0]));
        const enc = device.createCommandEncoder();
        const pass = enc.beginRenderPass({
          colorAttachments: [{
            view: ctx.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: "clear",
            storeOp: "store",
          }],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.setVertexBuffer(0, instBuf);
        pass.draw(4, n, 0, 0);
        pass.end();
        device.queue.submit([enc.finish()]);
      },
      destroy: () => device.destroy(),
    };
  } catch {
    return null;
  }
}

/* ============================================================
   Компонент сцены
   ============================================================ */
export function HeroScene() {
  const queueIntent = useAuraStore((s) => s.queueIntent);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLCanvasElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);
  const jumpRef = useRef<((i: number) => void) | null>(null);
  const [ui, setUi] = useState<UiState>({ phase: "travel", shopIdx: 0, offers: 0, found: [] });
  const [gpuOn, setGpuOn] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const scene = sceneRef.current!;
    const fx = fxRef.current!;
    const sctx = scene.getContext("2d")!;
    const fctx = fx.getContext("2d")!;
    let raf = 0;
    let disposed = false;
    let gpu: GpuField | null = null;
    let parts2d: P[] = [];
    const bursts: Burst[] = [];
    const ripples: { x: number; y: number; t: number }[] = [];

    let W = 0;
    let H = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      const r = wrap.getBoundingClientRect();
      W = r.width; H = r.height;
      for (const c of [scene, fx]) {
        c.width = Math.round(W * dpr);
        c.height = Math.round(H * dpr);
      }
      sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    initWebGPU(fx).then((g) => {
      if (disposed) { g?.destroy(); return; }
      gpu = g;
      setGpuOn(!!g);
    });

    /* --- состояние маршрута --- */
    const par = { x: 0, y: 0, tx: 0, ty: 0 };
    const st = {
      p: 0,
      idx: 0,
      mode: "travel" as "travel" | "scan" | "success" | "reset",
      t: 0,
      boost: 0,
      successT: 0,
      trail: [] as { x: number; y: number }[],
    };
    let lastUi = "";

    const pts = () =>
      SHOPS.map((s) => ({
        x: 30 + s.x * (W - 60),
        y: 46 + s.y * (H - 150),
      }));

    function pushUi(next: UiState) {
      const key = `${next.phase}${next.shopIdx}${next.offers}${next.found.length}`;
      if (key !== lastUi) {
        lastUi = key;
        setUi(next);
      }
    }

    function nodePos(i: number) {
      return catmull(pts(), NODE_T[i]);
    }

    jumpRef.current = (i: number) => {
      st.idx = i;
      st.mode = "travel";
      st.t = 0;
    };

    /* --- ввод --- */
    function onPointer(e: PointerEvent) {
      const r = wrap.getBoundingClientRect();
      par.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      par.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      wrap.style.setProperty("--px", String(par.tx * 6));
      wrap.style.setProperty("--py", String(par.ty * 5));
    }
    function onClick(e: MouseEvent) {
      const r = wrap.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      bursts.push({ x, y, at: performance.now() });
      ripples.push({ x, y, t: 0 });
      st.boost = 1.4;
    }
    wrap.addEventListener("pointermove", onPointer);
    wrap.addEventListener("click", onClick);

    /* --- отрисовка 2D-слоя --- */
    function drawScene(dt: number) {
      sctx.clearRect(0, 0, W, H);
      par.x += (par.tx - par.x) * Math.min(1, dt * 5);
      par.y += (par.ty - par.y) * Math.min(1, dt * 5);
      const path = pts();

      /* маршрут */
      sctx.save();
      sctx.translate(par.x * 0.6, par.y * 0.6);
      sctx.strokeStyle = "rgba(33,27,20,0.22)";
      sctx.lineWidth = 1.6;
      sctx.setLineDash([2, 7]);
      sctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const q = catmull(path, i / 80);
        i === 0 ? sctx.moveTo(q.x, q.y) : sctx.lineTo(q.x, q.y);
      }
      sctx.stroke();
      sctx.restore();

      /* узлы-магазины */
      SHOPS.forEach((shop, i) => {
        const q = nodePos(i);
        const nx = q.x + par.x * 1.2;
        const ny = q.y + par.y * 1.2;
        const visited = ui.found.includes(i) || st.idx > i || (st.idx === i && st.mode !== "travel");
        const active = st.idx === i && st.mode === "scan";

        sctx.save();
        if (active) {
          const k = (st.t % 1.4) / 1.4;
          sctx.strokeStyle = `rgba(18,133,122,${0.55 * (1 - k)})`;
          sctx.lineWidth = 2;
          sctx.beginPath();
          sctx.arc(nx, ny, 16 + k * 26, 0, Math.PI * 2);
          sctx.stroke();
        }
        sctx.beginPath();
        sctx.arc(nx, ny, 13, 0, Math.PI * 2);
        sctx.fillStyle = visited ? (shop.final ? "#12857a" : "#e8a33d") : "#fdf9ef";
        sctx.fill();
        sctx.lineWidth = 2;
        sctx.strokeStyle = "#211b14";
        sctx.stroke();
        if (visited) {
          sctx.strokeStyle = "#fdf9ef";
          sctx.lineWidth = 2.4;
          sctx.beginPath();
          sctx.moveTo(nx - 4.5, ny);
          sctx.lineTo(nx - 1, ny + 3.6);
          sctx.lineTo(nx + 5, ny - 3.6);
          sctx.stroke();
        } else {
          sctx.fillStyle = "#211b14";
          sctx.font = "700 11px 'JetBrains Mono', monospace";
          sctx.textAlign = "center";
          sctx.textBaseline = "middle";
          sctx.fillText(String(i + 1), nx, ny + 0.5);
        }
        sctx.restore();
      });

      /* ряби от кликов */
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.t += dt;
        const k = rp.t / 0.7;
        if (k >= 1) { ripples.splice(i, 1); continue; }
        sctx.strokeStyle = `rgba(201,135,27,${0.6 * (1 - k)})`;
        sctx.lineWidth = 2;
        sctx.beginPath();
        sctx.arc(rp.x, rp.y, 8 + k * 46, 0, Math.PI * 2);
        sctx.stroke();
      }

      /* комета-агент + след */
      if (st.mode !== "reset") {
        const q = catmull(path, Math.min(0.999, st.p));
        const cx = q.x + par.x * 1.8;
        const cy = q.y + par.y * 1.8;
        st.trail.push({ x: cx, y: cy });
        if (st.trail.length > 34) st.trail.shift();
        for (let i = 1; i < st.trail.length; i++) {
          const a = i / st.trail.length;
          sctx.strokeStyle = `rgba(18,133,122,${a * 0.5})`;
          sctx.lineWidth = a * 4;
          sctx.beginPath();
          sctx.moveTo(st.trail[i - 1].x, st.trail[i - 1].y);
          sctx.lineTo(st.trail[i].x, st.trail[i].y);
          sctx.stroke();
        }
        const t = performance.now() / 1000;
        sctx.save();
        const grad = sctx.createRadialGradient(cx, cy, 0, cx, cy, 26);
        grad.addColorStop(0, "rgba(18,133,122,0.5)");
        grad.addColorStop(1, "rgba(18,133,122,0)");
        sctx.fillStyle = grad;
        sctx.beginPath();
        sctx.arc(cx, cy, 26, 0, Math.PI * 2);
        sctx.fill();
        sctx.beginPath();
        sctx.arc(cx, cy, 8, 0, Math.PI * 2);
        sctx.fillStyle = "#12857a";
        sctx.fill();
        sctx.lineWidth = 2;
        sctx.strokeStyle = "#211b14";
        sctx.stroke();
        /* спутник */
        const ox = cx + Math.cos(t * 4) * 15;
        const oy = cy + Math.sin(t * 4) * 15;
        sctx.beginPath();
        sctx.arc(ox, oy, 3, 0, Math.PI * 2);
        sctx.fillStyle = "#e8a33d";
        sctx.fill();
        sctx.restore();
      }
    }

    /* --- основной цикл --- */
    let prev = performance.now();
    function tick(now: number) {
      if (disposed) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      st.boost = Math.max(0, st.boost - dt);
      const speed = (0.16 + (st.boost > 0 ? 0.34 : 0)) * dt * 2.2;

      if (st.mode === "travel") {
        const target = NODE_T[st.idx];
        st.p += speed;
        if (st.p >= target) {
          st.p = target;
          st.mode = "scan";
          st.t = 0;
        }
        pushUi({ phase: "travel", shopIdx: st.idx, offers: 0, found: [...uiRef.found] });
      } else if (st.mode === "scan") {
        st.t += dt * (st.boost > 0 ? 1.8 : 1);
        const offers = Math.min(14, Math.floor((st.t / 1.35) * 14));
        pushUi({ phase: "scan", shopIdx: st.idx, offers, found: [...uiRef.found] });
        if (st.t >= 1.35) {
          uiRef.found = [...uiRef.found.filter((f) => f !== st.idx), st.idx];
          if (st.idx >= SHOPS.length - 1) {
            st.mode = "success";
            st.successT = 0;
            pushUi({ phase: "success", shopIdx: st.idx, offers: 14, found: [...uiRef.found] });
          } else {
            st.idx += 1;
            st.mode = "travel";
          }
        }
      } else if (st.mode === "success") {
        st.successT += dt;
        if (st.successT > 4.2) {
          st.mode = "reset";
          st.t = 0;
        }
      } else if (st.mode === "reset") {
        st.t += dt;
        st.p = Math.max(0, st.p - dt * 0.9);
        if (st.t > 0.5 && st.p <= 0.001) {
          st.p = 0;
          st.idx = 0;
          uiRef.found = [];
          st.trail = [];
          st.mode = "travel";
          pushUi({ phase: "travel", shopIdx: 0, offers: 0, found: [] });
        }
      }

      stepParticles(parts2d, dt, W, H, gpu ? [] : bursts.splice(0));
      if (gpu) {
        fctx.clearRect(0, 0, W, H);
        gpu.frame(W, H, dt, bursts.splice(0));
      } else {
        fctx.clearRect(0, 0, W, H);
        for (const p of parts2d) {
          fctx.fillStyle = `rgba(${Math.round(p.r * 255)},${Math.round(p.g * 255)},${Math.round(p.b * 255)},${p.a})`;
          fctx.beginPath();
          fctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
          fctx.fill();
        }
      }
      drawScene(dt);
      raf = requestAnimationFrame(tick);
    }
    const uiRef = { found: [] as number[] };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrap.removeEventListener("pointermove", onPointer);
      wrap.removeEventListener("click", onClick);
      gpu?.destroy();
    };
  }, []);

  /* --- тексты статуса --- */
  const shop = SHOPS[ui.shopIdx];
  const status =
    ui.phase === "success"
      ? `Готово: 23 490 − 2 584 = 20 906 ₽ · выгода ${fmtInt(21990 - 20906)} ₽ против рыночного дна`
      : ui.phase === "scan"
        ? `Сканирую «${shop.name}»: ${ui.offers} из 14 предложений…`
        : `Агент летит к «${shop.name}»…`;

  const visibleCards = SHOPS.filter((_, i) => ui.found.includes(i)).slice(-3);

  return (
    <div
      ref={wrapRef}
      className="relative overflow-hidden rounded-[26px] border-[1.5px] border-ink-50 bg-ink-850 card-shadow select-none"
      style={{ height: "clamp(430px, 52vh, 540px)" }}
    >
      <canvas ref={fxRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={sceneRef} className="absolute inset-0 h-full w-full" />

      {/* мягкие цветовые поля */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#12857a]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#6d5fd0]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[#e8a33d]/10 blur-3xl" />

      {/* контент */}
      <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div
            className="max-w-md"
            style={{ transform: "translate(calc(var(--px, 0) * -0.6px), calc(var(--py, 0) * -0.6px))" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink-50 bg-paper px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-ink-200 shadow-[2px_2px_0_#211b14]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#12857a] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#12857a]" />
              </span>
              живой процесс подбора
            </span>
            <h1 className="mt-4 font-display text-[clamp(1.5rem,3.4vw,2.5rem)] font-bold leading-[1.12] tracking-tight text-ink-50">
              Один запрос — агент обегает магазины{" "}
              <span className="relative inline-block">
                за вас
                <svg viewBox="0 0 120 10" className="absolute -bottom-1.5 left-0 w-full" aria-hidden>
                  <path d="M3 7c30-5 84-5 114-2" fill="none" stroke="#e8a33d" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <div className="mt-4 flex min-h-[26px] items-center gap-2 font-mono text-[12.5px] text-ink-300">
              <span className={ui.phase === "success" ? "text-[#12857a]" : "text-ink-300"}>
                {status}
              </span>
              <span className="caret inline-block h-3.5 w-[7px] bg-[#12857a]" />
            </div>
            <button
              onClick={() => queueIntent("самые дешёвые AirPods Pro 3")}
              className="sticker mt-5 inline-flex items-center gap-2 rounded-[14px] bg-[#12857a] px-5 py-3 text-sm font-bold text-paper"
            >
              Запустить на AirPods Pro 3
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 12h15M13 6l6 6-6 6" />
              </svg>
            </button>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
              клик по сцене — ускорить агента
            </p>
          </div>

          {/* стек карточек магазинов */}
          <div
            className="relative hidden h-64 w-60 shrink-0 md:block"
            style={{ transform: "translate(calc(var(--px, 0) * 1.4px), calc(var(--py, 0) * 1.2px))" }}
          >
            <AnimatePresence>
              {ui.phase === "success" ? (
                <motion.div
                  key="final"
                  initial={{ opacity: 0, y: 24, rotate: -4 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="absolute right-0 top-4 w-60 rounded-[18px] border-[1.5px] border-ink-50 bg-[#12857a] p-4 text-paper shadow-[6px_6px_0_#211b14]"
                >
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] opacity-80">
                    честный итог · aura
                  </p>
                  <p className="mt-2 font-display text-2xl font-bold">{fmtRub(20906)}</p>
                  <p className="mt-1 font-mono text-[11px] opacity-90">
                    23 490 − 2 584 кэшбек
                  </p>
                  <span className="mt-3 inline-block rounded-full bg-paper px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#12857a]">
                    −{fmtInt(MARKET_FLOOR - 20906)} ₽ vs дно рынка
                  </span>
                </motion.div>
              ) : (
                visibleCards.map((s, i) => (
                  <motion.div
                    key={s.name}
                    initial={{ opacity: 0, x: 40, rotate: 3 }}
                    animate={{ opacity: 1, x: 0, rotate: (i - 1) * 2.4 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35 }}
                    className="absolute right-0 w-56 rounded-[16px] border-[1.5px] border-ink-50 bg-paper p-3.5 shadow-[4px_4px_0_#211b14]"
                    style={{ top: i * 30 + (3 - visibleCards.length) * 26 }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-bold text-ink-100">{s.name}</p>
                      <span className="rounded-full bg-[#12857a]/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#0e6e62]">
                        найдено
                      </span>
                    </div>
                    <p className="mt-1.5 font-mono text-lg font-bold text-ink-50">
                      {fmtRub(s.price)}
                    </p>
                    <p className="font-mono text-[10px] text-ink-400">{s.note}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
            {visibleCards.length === 0 && ui.phase !== "success" && (
              <div className="absolute right-0 top-8 w-56 rounded-[16px] border-[1.5px] border-dashed border-ink-500 p-4 text-center">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-400">
                  здесь появятся цены
                </p>
              </div>
            )}
          </div>
        </div>

        {/* нижняя панель: магазины-кнопки */}
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          {SHOPS.map((s, i) => {
            const done = ui.found.includes(i);
            const active = ui.shopIdx === i && ui.phase !== "success";
            return (
              <button
                key={s.name}
                onClick={(e) => {
                  e.stopPropagation();
                  jumpRef.current?.(i);
                }}
                className={`sticker-acc group flex items-center gap-2 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors ${
                  done
                    ? "bg-[#12857a] text-paper"
                    : active
                      ? "bg-[#e8a33d] text-ink-50"
                      : "bg-paper text-ink-200 hover:bg-ink-900"
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] font-mono text-[10px] font-bold ${
                  done ? "border-paper/60" : "border-ink-50"
                }`}>
                  {done ? "✓" : i + 1}
                </span>
                {s.name}
                <span className={`font-mono text-[10.5px] ${done ? "opacity-80" : "text-ink-400 group-hover:text-ink-300"}`}>
                  {fmtInt(s.final ?? s.price)} ₽
                </span>
              </button>
            );
          })}
          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-ink-600 bg-ink-900 px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-400 sm:inline-flex">
            <span className={`h-1.5 w-1.5 rounded-full ${gpuOn ? "bg-[#12857a]" : "bg-[#e8a33d]"}`} />
            {gpuOn ? "webgpu · gpu-частицы" : "canvas 2d · совместимый режим"}
          </span>
        </div>
      </div>
    </div>
  );
}

export { CASHBACK };
