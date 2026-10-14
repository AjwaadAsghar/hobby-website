/**
 * Generates simple, good-looking SVG placeholder product images so the store
 * works with zero downloads. Replace them by uploading real photos in admin.
 */
import fs from "node:fs";
import path from "node:path";

export type Shape = "car" | "truck" | "crawler" | "plane" | "drone" | "heli" | "boat" | "parts" | "battery" | "charger" | "radio" | "accessory";

const palettes: [string, string][] = [
  ["#f4f4f5", "#d4d4d8"],
  ["#eef2f7", "#c9d4e3"],
  ["#f6f1ea", "#e2d5c3"],
  ["#eef5f0", "#c8dccd"],
];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shapeSvg(shape: Shape, color: string): string {
  const dark = "#18181b";
  const mid = "#3f3f46";
  switch (shape) {
    case "car":
      return `
        <path d="M150 470 L210 390 Q230 365 270 360 L520 350 Q570 350 600 380 L660 440 Q690 450 690 480 L690 510 L110 510 L110 490 Q110 470 150 470Z" fill="${color}"/>
        <path d="M280 375 L500 368 Q530 368 550 390 L585 430 L240 440Z" fill="${dark}" opacity=".85"/>
        <rect x="120" y="500" width="560" height="22" rx="8" fill="${mid}"/>
        <circle cx="230" cy="530" r="62" fill="${dark}"/><circle cx="230" cy="530" r="26" fill="#a1a1aa"/>
        <circle cx="570" cy="530" r="62" fill="${dark}"/><circle cx="570" cy="530" r="26" fill="#a1a1aa"/>`;
    case "truck":
      return `
        <rect x="170" y="330" width="460" height="120" rx="30" fill="${color}"/>
        <path d="M300 335 L500 335 L540 390 L260 390Z" fill="${dark}" opacity=".85"/>
        <rect x="150" y="440" width="500" height="26" rx="10" fill="${mid}"/>
        <circle cx="230" cy="510" r="85" fill="${dark}"/><circle cx="230" cy="510" r="36" fill="#a1a1aa"/>
        <circle cx="570" cy="510" r="85" fill="${dark}"/><circle cx="570" cy="510" r="36" fill="#a1a1aa"/>`;
    case "crawler":
      return `
        <path d="M200 420 L240 330 L540 330 L590 420Z" fill="${color}"/>
        <rect x="270" y="345" width="230" height="55" rx="10" fill="${dark}" opacity=".85"/>
        <rect x="180" y="415" width="440" height="40" rx="10" fill="${mid}"/>
        <rect x="560" y="300" width="20" height="60" fill="${mid}"/>
        <circle cx="235" cy="500" r="78" fill="${dark}" stroke="#52525b" stroke-width="16" stroke-dasharray="14 10"/>
        <circle cx="565" cy="500" r="78" fill="${dark}" stroke="#52525b" stroke-width="16" stroke-dasharray="14 10"/>`;
    case "plane":
      return `
        <path d="M120 420 Q120 390 170 385 L600 370 Q680 372 700 400 Q680 428 600 430 L170 445 Q120 445 120 420Z" fill="${color}"/>
        <path d="M330 400 L470 400 L420 210 L380 210Z" fill="${color}" opacity=".9"/>
        <path d="M330 420 L470 420 L420 610 L380 610Z" fill="${color}" opacity=".75"/>
        <path d="M140 400 L200 400 L170 310 L150 310Z" fill="${mid}"/>
        <path d="M600 380 Q650 385 660 400 L600 400Z" fill="${dark}"/>
        <rect x="696" y="340" width="10" height="120" rx="5" fill="${mid}"/>`;
    case "drone":
      return `
        <g stroke="${mid}" stroke-width="26" stroke-linecap="round"><line x1="230" y1="230" x2="570" y2="570"/><line x1="570" y1="230" x2="230" y2="570"/></g>
        <rect x="320" y="330" width="160" height="140" rx="36" fill="${color}"/>
        <circle cx="400" cy="485" r="26" fill="${dark}"/>
        ${[
          [230, 230],
          [570, 230],
          [230, 570],
          [570, 570],
        ]
          .map(
            ([x, y]) =>
              `<circle cx="${x}" cy="${y}" r="30" fill="${dark}"/><ellipse cx="${x}" cy="${y}" rx="110" ry="16" fill="${dark}" opacity=".25"/>`,
          )
          .join("")}`;
    case "heli":
      return `
        <ellipse cx="330" cy="430" rx="150" ry="95" fill="${color}"/>
        <path d="M250 400 Q260 350 330 345 L370 345 L370 420 L240 430Z" fill="${dark}" opacity=".8"/>
        <rect x="440" y="415" width="260" height="22" rx="10" fill="${mid}"/>
        <path d="M680 380 L710 380 L700 460 L680 460Z" fill="${color}"/>
        <rect x="320" y="300" width="20" height="45" fill="${mid}"/>
        <rect x="90" y="285" width="480" height="14" rx="7" fill="${dark}"/>
        <path d="M230 540 L450 540 M260 520 L250 540 M410 520 L420 540" stroke="${mid}" stroke-width="14" stroke-linecap="round"/>`;
    case "boat":
      return `
        <path d="M110 430 L690 430 L620 540 Q600 560 560 560 L200 560 Q170 560 150 530Z" fill="${color}"/>
        <path d="M260 430 L320 360 L520 360 L560 430Z" fill="${dark}" opacity=".85"/>
        <rect x="110" y="425" width="580" height="14" rx="7" fill="${mid}"/>
        <path d="M120 600 Q220 580 320 600 T520 600 T720 600" stroke="#60a5fa" stroke-width="10" fill="none" opacity=".6"/>`;
    case "parts":
      return `
        <circle cx="330" cy="400" r="140" fill="none" stroke="${color}" stroke-width="60" stroke-dasharray="34 22"/>
        <circle cx="330" cy="400" r="100" fill="${color}"/><circle cx="330" cy="400" r="34" fill="#e4e4e7"/>
        <circle cx="560" cy="470" r="80" fill="none" stroke="${mid}" stroke-width="40" stroke-dasharray="22 16"/>
        <circle cx="560" cy="470" r="55" fill="${mid}"/><circle cx="560" cy="470" r="20" fill="#e4e4e7"/>`;
    case "battery":
      return `
        <rect x="170" y="290" width="460" height="230" rx="28" fill="${color}"/>
        <rect x="190" y="310" width="420" height="60" rx="12" fill="${dark}" opacity=".85"/>
        <path d="M410 395 L360 460 L400 460 L380 515 L450 440 L410 440 L430 395Z" fill="#fde047"/>
        <path d="M630 330 Q690 330 690 390 L690 470" stroke="${dark}" stroke-width="14" fill="none"/>
        <path d="M630 360 Q670 360 670 410 L670 470" stroke="#dc2626" stroke-width="14" fill="none"/>
        <rect x="652" y="465" width="56" height="40" rx="6" fill="#facc15"/>`;
    case "charger":
      return `
        <rect x="200" y="260" width="400" height="300" rx="36" fill="${dark}"/>
        <rect x="235" y="295" width="330" height="170" rx="14" fill="${color}"/>
        <text x="400" y="400" text-anchor="middle" font-family="Arial, sans-serif" font-size="70" font-weight="700" fill="#fff">8.40V</text>
        <circle cx="300" cy="510" r="18" fill="#dc2626"/><circle cx="360" cy="510" r="18" fill="#18181b" stroke="#71717a" stroke-width="4"/>
        <rect x="430" y="495" width="120" height="30" rx="8" fill="#52525b"/>`;
    case "radio":
      return `
        <path d="M200 330 Q200 290 250 290 L550 290 Q600 290 600 330 L620 560 Q620 600 580 600 L220 600 Q180 600 180 560Z" fill="${color}"/>
        <rect x="300" y="320" width="200" height="110" rx="12" fill="${dark}"/>
        <circle cx="290" cy="500" r="52" fill="${dark}"/><rect x="282" y="430" width="16" height="70" rx="8" fill="#a1a1aa"/>
        <circle cx="510" cy="500" r="52" fill="${dark}"/><rect x="502" y="430" width="16" height="70" rx="8" fill="#a1a1aa"/>
        <rect x="392" y="140" width="16" height="160" rx="8" fill="${mid}"/>`;
    case "accessory":
    default:
      return `
        <rect x="190" y="330" width="420" height="250" rx="24" fill="${color}"/>
        <path d="M320 330 L320 280 Q320 260 340 260 L460 260 Q480 260 480 280 L480 330" stroke="${dark}" stroke-width="26" fill="none"/>
        <rect x="190" y="420" width="420" height="18" fill="${dark}" opacity=".5"/>
        <rect x="370" y="410" width="60" height="40" rx="8" fill="${dark}"/>`;
  }
}

export function placeholderSvg(opts: { title: string; shape: Shape; color: string; angle: number; label?: string }): string {
  const [bg1, bg2] = palettes[opts.angle % palettes.length];
  const rotate = [0, -8, 6, -3][opts.angle % 4];
  const scale = [1, 0.92, 1.05, 0.98][opts.angle % 4];
  const title = esc(opts.title.length > 34 ? opts.title.slice(0, 32) + "…" : opts.title);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${esc(opts.title)}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></radialGradient>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity=".22"/></filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <ellipse cx="400" cy="640" rx="280" ry="26" fill="#000" opacity=".08"/>
  <g filter="url(#sh)" transform="translate(400 420) rotate(${rotate}) scale(${scale}) translate(-400 -420)">${shapeSvg(opts.shape, opts.color)}</g>
  <text x="400" y="720" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#27272a">${title}</text>
  ${opts.label ? `<text x="400" y="760" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#52525b">${esc(opts.label)}</text>` : ""}
</svg>`;
}

const viewLabels = ["Front view", "Side view", "Detail"];

/**
 * Neutral "photo coming soon" tile for products without real photos: a faint
 * silhouette of the product type, a label and the brand. Honest about being a
 * placeholder, and calm enough to sit in a product grid.
 */
export function comingSoonSvg(opts: { title: string; shape: Shape; angle: number; brand?: string }): string {
  const view = viewLabels[opts.angle % viewLabels.length];
  const brand = opts.brand ? esc(opts.brand.toUpperCase()) : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800" role="img" aria-label="${esc(opts.title)} – photo coming soon">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f7f7f8"/><stop offset="100%" stop-color="#ececef"/></linearGradient>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#d4d4d8"/></pattern>
    <filter id="ghost"><feColorMatrix type="matrix" values="0 0 0 0 0.63  0 0 0 0 0.63  0 0 0 0 0.67  0 0 0 1 0"/></filter>
  </defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <rect width="800" height="800" fill="url(#dots)" opacity=".7"/>
  <g filter="url(#ghost)" opacity=".42" transform="translate(400 320) scale(.6) translate(-400 -420)">${shapeSvg(opts.shape, "#000")}</g>
  <g font-family="Arial, Helvetica, sans-serif" text-anchor="middle">
    <rect x="130" y="500" width="540" height="92" rx="46" fill="#ffffff" stroke="#d4d4d8" stroke-width="3"/>
    <text x="400" y="561" font-size="44" font-weight="700" fill="#3f3f46">Photo coming soon</text>
    ${brand ? `<text x="400" y="662" font-size="38" font-weight="700" letter-spacing="4" fill="#71717a">${brand}</text>` : ""}
    <text x="400" y="${brand ? 714 : 662}" font-size="30" fill="#a1a1aa">${view}</text>
  </g>
</svg>`;
}

export function writePlaceholder(fileName: string, svg: string): string {
  const dir = path.join(process.cwd(), "public", "placeholders");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), svg);
  return `/placeholders/${fileName}`;
}
