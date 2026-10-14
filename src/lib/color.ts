/** Returns a safe #rrggbb or the fallback. */
export function safeHex(input: string | undefined, fallback = "#d7261e"): string {
  const v = (input ?? "").trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return ("#" + v.slice(1).split("").map((c) => c + c).join("")).toLowerCase();
  return fallback;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** White or near-black text, whichever reads better on the accent colour. */
export function readableOn(hex: string): string {
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#18181b") ? "#ffffff" : "#18181b";
}

function mix(hex: string, target: string, t: number): string {
  const a = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const b = [1, 3, 5].map((i) => parseInt(target.slice(i, i + 2), 16));
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

/** Nudges a colour toward black or white until it reaches the contrast ratio on `bg` (used for brand-coloured text). */
export function ensureContrast(hex: string, bg: string, ratio = 4.5): string {
  const toward = contrastRatio(bg, "#000000") > contrastRatio(bg, "#ffffff") ? "#000000" : "#ffffff";
  let c = hex;
  for (let i = 1; i <= 20 && contrastRatio(c, bg) < ratio; i++) c = mix(hex, toward, i * 0.05);
  return c;
}
