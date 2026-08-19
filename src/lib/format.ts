const rub = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function fmtRub(n: number): string {
  return `${rub.format(n)}\u00A0₽`;
}

export function fmtInt(n: number): string {
  return rub.format(n);
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

/** "+7.4s" style session timestamp for the live feed */
export function fmtT(ms: number): string {
  return `+${(ms / 1000).toFixed(1)}s`;
}

export function clock(d: Date): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
