/**
 * Studio-style category illustrations: shaded, product-photo look (soft studio
 * backdrop, contact shadows, metal and gloss gradients) instead of flat
 * cartoons. Replace any of them by uploading a real photo in Admin → Categories.
 */

export type CategoryArt = "esc" | "battery" | "charger" | "motor" | "servo" | "plug" | "radio" | "propeller" | "accessory";

/** Silicone wire: base stroke plus a soft highlight along its top edge. */
function wire(d: string, color: string, width = 14) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${d}" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="${Math.max(2, width / 4)}" stroke-linecap="round" transform="translate(-1 -${Math.round(width / 4)})"/>`;
}

/** Gold bullet connector centred at x,y, pointing along angle (deg). */
function bullet(x: number, y: number, angle: number) {
  return `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="-6" y="-9" width="34" height="18" rx="5" fill="url(#gold)"/><rect x="-6" y="-9" width="34" height="5" rx="2" fill="#fff" opacity=".45"/></g>`;
}

/** XT60-style yellow plug body at x,y (top-left), facing right. */
function xt60(x: number, y: number, flip = false) {
  const t = flip ? `translate(${x + 120} ${y}) scale(-1 1)` : `translate(${x} ${y})`;
  return `<g transform="${t}">
    <path d="M0 6 Q0 0 6 0 H96 L120 18 V62 L96 80 H6 Q0 80 0 74 Z" fill="url(#yellow)"/>
    <path d="M6 0 H96 L120 18 H10 Z" fill="#fde68a" opacity=".7"/>
    <rect x="18" y="22" width="22" height="36" rx="6" fill="#a16207" opacity=".35"/>
    <rect x="62" y="22" width="22" height="36" rx="6" fill="#a16207" opacity=".35"/>
    <circle cx="120" cy="30" r="7" fill="url(#gold)"/><circle cx="120" cy="52" r="7" fill="url(#gold)"/>
  </g>`;
}

const defs = `
  <radialGradient id="bg" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="#fafafa"/><stop offset=".55" stop-color="#e7e7ea"/><stop offset="1" stop-color="#c9c9cf"/></radialGradient>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="lift" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity=".28"/></filter>
  <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde68a"/><stop offset=".45" stop-color="#d4a017"/><stop offset="1" stop-color="#8a6508"/></linearGradient>
  <linearGradient id="yellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset=".6" stop-color="#eab308"/><stop offset="1" stop-color="#a16207"/></linearGradient>
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#52525b"/><stop offset=".3" stop-color="#f4f4f5"/><stop offset=".55" stop-color="#a1a1aa"/><stop offset=".8" stop-color="#e4e4e7"/><stop offset="1" stop-color="#3f3f46"/></linearGradient>
  <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <linearGradient id="black" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f3f46"/><stop offset=".5" stop-color="#18181b"/><stop offset="1" stop-color="#09090b"/></linearGradient>
`;

function scene(body: string, shadow: { cx: number; rx: number } = { cx: 400, rx: 250 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>${defs}</defs>
  <rect width="800" height="800" fill="url(#bg)"/>
  <!-- Scaled in so nothing touches the edges (tiles crop the image a little). -->
  <g transform="translate(400 380) scale(.8) translate(-400 -400)">
    <ellipse cx="${shadow.cx}" cy="575" rx="${shadow.rx}" ry="34" fill="#000" opacity=".28" filter="url(#soft)"/>
    ${body}
  </g>
</svg>`;
}

const art: Record<CategoryArt, () => string> = {
  esc: () =>
    scene(`
    <defs><linearGradient id="shrink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60a5fa"/><stop offset=".35" stop-color="#2563eb"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs>
    ${wire("M250 390 C190 380 160 330 120 300", "#18181b")}${bullet(112, 296, 205)}
    ${wire("M250 420 C180 420 150 420 110 420", "#18181b")}${bullet(104, 420, 180)}
    ${wire("M250 450 C190 462 160 510 120 540", "#18181b")}${bullet(112, 546, 150)}
    ${wire("M550 395 C610 390 630 350 660 330", "#dc2626", 18)}
    ${wire("M550 450 C610 455 640 490 660 500", "#18181b", 18)}
    ${xt60(655, 300)}
    ${wire("M420 485 C420 540 470 560 520 600", "#f97316", 5)}${wire("M430 485 C432 540 480 556 530 596", "#dc2626", 5)}${wire("M440 485 C444 538 490 552 540 592", "#78350f", 5)}
    <g filter="url(#lift)">
      <rect x="240" y="320" width="320" height="170" rx="46" fill="url(#shrink)"/>
      <rect x="252" y="326" width="296" height="54" rx="27" fill="url(#gloss)"/>
      <rect x="290" y="372" width="180" height="70" rx="10" fill="#f8fafc"/>
      <rect x="306" y="386" width="96" height="14" rx="4" fill="#1e3a8a"/>
      <rect x="306" y="410" width="140" height="8" rx="3" fill="#94a3b8"/>
      <rect x="306" y="424" width="110" height="8" rx="3" fill="#94a3b8"/>
      <text x="456" y="400" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="800" fill="#dc2626" text-anchor="end">40A</text>
      <g fill="url(#steel)">${[0, 1, 2, 3, 4].map((i) => `<rect x="${488 + i * 12}" y="352" width="7" height="110" rx="3"/>`).join("")}</g>
    </g>`),

  battery: () =>
    scene(`
    <defs><linearGradient id="label" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ea580c"/><stop offset=".55" stop-color="#f97316"/><stop offset="1" stop-color="#18181b"/></linearGradient></defs>
    ${wire("M600 360 C660 350 680 300 690 270", "#dc2626", 16)}${wire("M600 390 C670 392 700 340 712 290", "#18181b", 16)}
    ${xt60(640, 170)}
    ${wire("M600 430 C650 440 660 480 690 500", "#f4f4f5", 6)}${wire("M600 438 C648 450 652 490 680 512", "#d4d4d8", 6)}
    <rect x="672" y="492" width="40" height="30" rx="5" fill="#fafafa" stroke="#a1a1aa" stroke-width="2" transform="rotate(30 692 507)"/>
    <g filter="url(#lift)">
      <path d="M190 320 L240 270 H650 L600 320 Z" fill="#3f3f46"/>
      <path d="M600 320 L650 270 V450 L600 500 Z" fill="#0c0c0e"/>
      <rect x="190" y="320" width="410" height="180" rx="8" fill="url(#black)"/>
      <rect x="206" y="342" width="378" height="136" rx="6" fill="url(#label)"/>
      <rect x="206" y="342" width="378" height="40" rx="6" fill="url(#gloss)"/>
      <text x="226" y="398" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="900" fill="#fff">5000mAh</text>
      <text x="226" y="440" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" fill="#fff" opacity=".92">2S 7.4V · 50C LiPo</text>
      <path d="M520 360 L496 410 H520 L506 456 L556 396 H530 L546 360 Z" fill="#fde047"/>
    </g>`),

  charger: () =>
    scene(`
    <defs><linearGradient id="lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f3b47"/><stop offset="1" stop-color="#062028"/></linearGradient></defs>
    <g filter="url(#lift)">
      <path d="M210 260 L250 220 H630 L590 260 Z" fill="#52525b"/>
      <path d="M590 260 L630 220 V470 L590 510 Z" fill="#111114"/>
      <rect x="210" y="260" width="380" height="250" rx="14" fill="url(#black)"/>
      <rect x="236" y="286" width="230" height="134" rx="10" fill="#27272a"/>
      <rect x="246" y="296" width="210" height="114" rx="6" fill="url(#lcd)"/>
      <text x="262" y="344" font-family="Consolas, 'Courier New', monospace" font-size="34" font-weight="700" fill="#5eead4">8.40V</text>
      <text x="262" y="390" font-family="Consolas, 'Courier New', monospace" font-size="24" fill="#5eead4" opacity=".85">2S BAL 2.0A</text>
      <rect x="246" y="296" width="210" height="40" rx="6" fill="url(#gloss)" opacity=".5"/>
      <circle cx="530" cy="330" r="34" fill="url(#steel)"/><circle cx="530" cy="330" r="22" fill="#27272a"/>
      ${[0, 1, 2].map((i) => `<rect x="${246 + i * 78}" y="444" width="62" height="34" rx="10" fill="#3f3f46"/><rect x="${246 + i * 78}" y="444" width="62" height="12" rx="6" fill="#fff" opacity=".12"/>`).join("")}
      <circle cx="510" cy="460" r="14" fill="#dc2626"/><circle cx="550" cy="460" r="14" fill="#18181b" stroke="#52525b" stroke-width="3"/>
      <circle cx="510" cy="456" r="5" fill="#fff" opacity=".35"/>
      <rect x="214" y="264" width="372" height="18" rx="8" fill="#fff" opacity=".07"/>
    </g>`),

  motor: () =>
    scene(`
    <defs>
      <linearGradient id="bell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f1d1d"/><stop offset=".28" stop-color="#f87171"/><stop offset=".5" stop-color="#b91c1c"/><stop offset=".78" stop-color="#ef4444"/><stop offset="1" stop-color="#450a0a"/></linearGradient>
      <linearGradient id="copper" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c2d12"/><stop offset=".5" stop-color="#f59e0b"/><stop offset="1" stop-color="#7c2d12"/></linearGradient>
    </defs>
    ${wire("M360 520 C350 560 300 580 250 600", "#18181b", 10)}${bullet(240, 604, 160)}
    ${wire("M400 522 C400 570 380 600 360 630", "#18181b", 10)}${bullet(354, 640, 120)}
    ${wire("M440 520 C460 565 510 585 560 600", "#18181b", 10)}${bullet(566, 604, 20)}
    <g filter="url(#lift)">
      <rect x="388" y="170" width="24" height="90" rx="6" fill="url(#steel)"/>
      <rect x="250" y="488" width="300" height="34" rx="10" fill="url(#steel)"/>
      <rect x="290" y="250" width="220" height="250" rx="16" fill="url(#bell)"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${312 + i * 50}" y="300" width="28" height="64" rx="8" fill="url(#copper)"/><rect x="${312 + i * 50}" y="300" width="28" height="64" rx="8" fill="#000" opacity=".25"/>`).join("")}
      <rect x="290" y="390" width="220" height="10" fill="#000" opacity=".25"/>
      <ellipse cx="400" cy="250" rx="110" ry="30" fill="#dc2626"/>
      <ellipse cx="400" cy="250" rx="110" ry="30" fill="url(#gloss)"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M400 250 L${400 + Math.cos((i * Math.PI) / 3) * 92} ${250 + Math.sin((i * Math.PI) / 3) * 24}" stroke="#450a0a" stroke-width="6" opacity=".5"/>`).join("")}
      <ellipse cx="400" cy="250" rx="22" ry="8" fill="url(#steel)"/>
      <rect x="298" y="258" width="26" height="236" rx="10" fill="#fff" opacity=".18"/>
    </g>`, { cx: 400, rx: 220 }),

  servo: () =>
    scene(`
    ${wire("M560 470 C620 480 650 520 690 560", "#78350f", 8)}${wire("M560 480 C618 492 642 532 680 572", "#dc2626", 8)}${wire("M560 490 C614 504 634 544 670 584", "#f97316", 8)}
    <g filter="url(#lift)">
      <path d="M240 300 L270 270 H590 L560 300 Z" fill="#3f3f46"/>
      <path d="M560 300 L590 270 V500 L560 530 Z" fill="#09090b"/>
      <rect x="196" y="352" width="408" height="40" rx="8" fill="#27272a"/>
      <circle cx="222" cy="372" r="9" fill="url(#steel)"/><circle cx="578" cy="372" r="9" fill="url(#steel)"/>
      <rect x="240" y="300" width="320" height="230" rx="12" fill="url(#black)"/>
      <rect x="262" y="400" width="276" height="100" rx="6" fill="#1d4ed8"/>
      <rect x="262" y="400" width="276" height="30" rx="6" fill="url(#gloss)"/>
      <text x="400" y="452" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="900" fill="#fff" text-anchor="middle">METAL GEAR</text>
      <text x="400" y="484" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700" fill="#bfdbfe" text-anchor="middle">25 KG · DIGITAL</text>
      <ellipse cx="330" cy="284" rx="46" ry="16" fill="#27272a"/>
      <g transform="rotate(-25 330 268)">
        <rect x="200" y="256" width="260" height="26" rx="13" fill="#fafafa"/>
        <rect x="200" y="256" width="260" height="9" rx="4" fill="#fff"/>
        <rect x="200" y="274" width="260" height="8" rx="4" fill="#d4d4d8"/>
        ${[0, 1, 2, 3].map((i) => `<circle cx="${222 + i * 20}" cy="269" r="4" fill="#a1a1aa"/><circle cx="${438 - i * 20}" cy="269" r="4" fill="#a1a1aa"/>`).join("")}
      </g>
      <circle cx="330" cy="268" r="16" fill="url(#steel)"/><circle cx="330" cy="268" r="6" fill="#52525b"/>
    </g>`),

  plug: () =>
    scene(`
    ${wire("M110 300 C170 300 200 330 236 340", "#dc2626", 20)}${wire("M110 380 C170 380 200 372 236 362", "#18181b", 20)}
    ${wire("M690 420 C630 420 600 440 564 450", "#dc2626", 20)}${wire("M690 500 C630 500 600 486 564 474", "#18181b", 20)}
    <g filter="url(#lift)">
      <g transform="rotate(8 300 350)">${xt60(230, 310)}</g>
      <g transform="rotate(8 500 460)">${xt60(450, 420, true)}</g>
    </g>`, { cx: 400, rx: 280 }),

  radio: () =>
    scene(`
    <defs><linearGradient id="tx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#52525b"/><stop offset=".4" stop-color="#27272a"/><stop offset="1" stop-color="#0c0c0e"/></linearGradient></defs>
    <g filter="url(#lift)">
      <rect x="392" y="120" width="16" height="120" rx="8" fill="#27272a"/><rect x="396" y="120" width="4" height="110" rx="2" fill="#fff" opacity=".2"/>
      <path d="M280 236 Q400 196 520 236 L536 260 H264 Z" fill="#3f3f46"/>
      <path d="M180 300 Q180 250 240 250 H560 Q620 250 620 300 L650 470 Q660 540 590 540 H210 Q140 540 150 470 Z" fill="url(#tx)"/>
      <path d="M186 296 Q190 262 240 262 H560 Q610 262 614 296" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="6"/>
      ${[[270, 270], [320, 262], [480, 262], [530, 270]].map(([x, y]) => `<rect x="${x - 6}" y="${y - 44}" width="12" height="46" rx="5" fill="url(#steel)"/>`).join("")}
      <rect x="330" y="300" width="140" height="90" rx="10" fill="#0b1220"/>
      <rect x="338" y="308" width="124" height="74" rx="6" fill="#1e3a5f"/>
      <rect x="338" y="308" width="124" height="26" rx="6" fill="url(#gloss)" opacity=".5"/>
      ${[260, 540].map((cx) => `
        <circle cx="${cx}" cy="420" r="62" fill="#18181b"/><circle cx="${cx}" cy="420" r="62" fill="none" stroke="#3f3f46" stroke-width="6"/>
        <circle cx="${cx}" cy="420" r="30" fill="#27272a"/>
        <rect x="${cx - 7}" y="356" width="14" height="66" rx="6" fill="url(#steel)"/>
        <rect x="${cx - 14}" y="340" width="28" height="30" rx="8" fill="url(#steel)"/>`).join("")}
      ${[0, 1, 2].map((i) => `<circle cx="${362 + i * 38}" cy="430" r="11" fill="#3f3f46"/>`).join("")}
    </g>`),

  propeller: () =>
    scene(`
    <defs><linearGradient id="blade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#52525b"/><stop offset=".35" stop-color="#18181b"/><stop offset="1" stop-color="#09090b"/></linearGradient></defs>
    <g filter="url(#lift)">
      <g transform="rotate(-16 400 390)">
        <path d="M400 372 C500 330 640 316 712 350 C722 362 716 376 700 382 C620 410 500 416 400 408 Z" fill="url(#blade)"/>
        <path d="M420 370 C520 334 640 324 700 352" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="5"/>
        <path d="M400 372 C300 364 180 368 100 400 C88 412 94 426 110 430 C190 446 300 428 400 408 Z" fill="url(#blade)"/>
        <path d="M380 372 C290 368 180 374 112 402" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="5"/>
      </g>
      <circle cx="400" cy="390" r="48" fill="#18181b"/>
      <circle cx="400" cy="390" r="30" fill="url(#steel)"/>
      <circle cx="400" cy="390" r="10" fill="#3f3f46"/>
      <path d="M372 372 A34 34 0 0 1 418 362" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4"/>
    </g>`, { cx: 400, rx: 300 }),

  accessory: () =>
    scene(`
    <g filter="url(#lift)">
      ${[
        ["#dc2626", "#7f1d1d", -24],
        ["#2563eb", "#1e3a8a", -8],
        ["#16a34a", "#14532d", 8],
        ["#d4a017", "#713f12", 24],
      ]
        .map(
          ([c, d, a], i) => `
        <g transform="rotate(${a} 400 560)">
          <defs><linearGradient id="h${i}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${d}"/><stop offset=".35" stop-color="${c}"/><stop offset=".6" stop-color="${d}"/><stop offset=".85" stop-color="${c}"/><stop offset="1" stop-color="${d}"/></linearGradient></defs>
          <rect x="393" y="170" width="14" height="190" rx="4" fill="url(#steel)"/>
          <path d="M393 170 L400 156 L407 170 Z" fill="#a1a1aa"/>
          <rect x="370" y="350" width="60" height="190" rx="14" fill="url(#h${i})"/>
          ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<rect x="370" y="${372 + k * 16}" width="60" height="5" fill="#000" opacity=".22"/>`).join("")}
          <rect x="376" y="356" width="10" height="178" rx="5" fill="#fff" opacity=".22"/>
        </g>`,
        )
        .join("")}
    </g>`, { cx: 400, rx: 230 }),
};

export function categoryArtSvg(kind: CategoryArt): string {
  return art[kind]();
}
