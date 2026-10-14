// Coloring pages: simple thick-line drawings with closed shapes, so the paint bucket fills them nicely.
// Each svg uses a 400×400 box; lines are drawn on a layer above the paint.
const LINE = 'fill="none" stroke="#2b2d42" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"';

const wrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><g ${LINE}>${body}</g></svg>`;

function petals(cx, cy, dist, r, n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out += `<circle cx="${(cx + Math.cos(a) * dist).toFixed(1)}" cy="${(cy + Math.sin(a) * dist).toFixed(1)}" r="${r}"/>`;
  }
  return out;
}

function rays(cx, cy, inner, outer, n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.PI / n / 1.6;
    const p = (ang, rad) => `${(cx + Math.cos(ang) * rad).toFixed(1)},${(cy + Math.sin(ang) * rad).toFixed(1)}`;
    out += `<polygon points="${p(a - s, inner)} ${p(a, outer)} ${p(a + s, inner)}"/>`;
  }
  return out;
}

export const PAGES = [
  {
    id: 'cat',
    name: 'the cat',
    emoji: '🐱',
    svg: wrap(`
      <polygon points="105,165 115,55 185,120"/>
      <polygon points="295,165 285,55 215,120"/>
      <circle cx="200" cy="225" r="115"/>
      <circle cx="158" cy="200" r="16"/><circle cx="242" cy="200" r="16"/>
      <polygon points="186,245 214,245 200,262"/>
      <path d="M200 262 q-18 26 -42 12 M200 262 q18 26 42 12"/>
      <path d="M120 250 l-70 -10 M120 265 l-68 12 M280 250 l70 -10 M280 265 l68 12"/>`),
  },
  {
    id: 'fish',
    name: 'the fish',
    emoji: '🐟',
    svg: wrap(`
      <polygon points="285,200 375,125 375,275"/>
      <ellipse cx="175" cy="200" rx="125" ry="80"/>
      <circle cx="105" cy="180" r="15"/>
      <path d="M150 200 q30 -40 60 0 q-30 40 -60 0z"/>
      <circle cx="60" cy="90" r="14"/><circle cx="90" cy="55" r="10"/><circle cx="120" cy="80" r="8"/>`),
  },
  {
    id: 'house',
    name: 'the house',
    emoji: '🏠',
    svg: wrap(`
      <rect x="258" y="80" width="38" height="70"/>
      <rect x="90" y="185" width="220" height="180"/>
      <polygon points="65,195 200,70 335,195"/>
      <rect x="170" y="275" width="60" height="90"/>
      <rect x="110" y="215" width="50" height="50"/><rect x="240" y="215" width="50" height="50"/>
      <path d="M20 365 H380"/>`),
  },
  {
    id: 'flower',
    name: 'the flower',
    emoji: '🌸',
    svg: wrap(`
      <path d="M200 190 V380"/>
      <ellipse cx="150" cy="300" rx="45" ry="20" transform="rotate(-30 150 300)"/>
      <ellipse cx="250" cy="320" rx="45" ry="20" transform="rotate(30 250 320)"/>
      ${petals(200, 140, 72, 44, 6)}
      <circle cx="200" cy="140" r="40"/>`),
  },
  {
    id: 'rainbow',
    name: 'the rainbow',
    emoji: '🌈',
    svg: wrap(`
      ${[175, 145, 115, 85].map((r) => `<path d="M${200 - r} 300 A${r} ${r} 0 0 1 ${200 + r} 300"/>`).join('')}
      <path d="M25 300 H375"/>
      <circle cx="45" cy="315" r="35"/><circle cx="85" cy="320" r="30"/>
      <circle cx="315" cy="320" r="30"/><circle cx="355" cy="315" r="35"/>`),
  },
  {
    id: 'butterfly',
    name: 'the butterfly',
    emoji: '🦋',
    svg: wrap(`
      <ellipse cx="128" cy="150" rx="75" ry="62" transform="rotate(-20 128 150)"/>
      <ellipse cx="272" cy="150" rx="75" ry="62" transform="rotate(20 272 150)"/>
      <ellipse cx="140" cy="262" rx="58" ry="46" transform="rotate(20 140 262)"/>
      <ellipse cx="260" cy="262" rx="58" ry="46" transform="rotate(-20 260 262)"/>
      <circle cx="120" cy="150" r="20"/><circle cx="280" cy="150" r="20"/>
      <ellipse cx="200" cy="205" rx="16" ry="95"/>
      <path d="M192 115 q-20 -50 -45 -60 M208 115 q20 -50 45 -60"/>
      <circle cx="143" cy="52" r="8"/><circle cx="257" cy="52" r="8"/>`),
  },
  {
    id: 'car',
    name: 'the car',
    emoji: '🚗',
    svg: wrap(`
      <polygon points="105,200 150,135 262,135 305,200"/>
      <rect x="45" y="200" width="310" height="90" rx="22"/>
      <polygon points="128,196 160,150 200,150 200,196"/>
      <polygon points="212,196 212,150 252,150 282,196"/>
      <circle cx="120" cy="292" r="36"/><circle cx="280" cy="292" r="36"/>
      <circle cx="120" cy="292" r="12"/><circle cx="280" cy="292" r="12"/>
      <circle cx="335" cy="225" r="10"/>`),
  },
  {
    id: 'sun',
    name: 'the sun',
    emoji: '☀️',
    svg: wrap(`
      ${rays(200, 200, 100, 180, 10)}
      <circle cx="200" cy="200" r="90"/>
      <circle cx="168" cy="180" r="12"/><circle cx="232" cy="180" r="12"/>
      <path d="M155 225 q45 45 90 0"/>`),
  },
];

export function findPage(id) {
  return PAGES.find((p) => p.id === id) || null;
}

// Resolves to an <img> ready to draw onto a canvas.
export function pageImage(page) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(page.svg)}`;
  });
}
