// Coloring pages: thick-line drawings made of closed shapes, so the paint bucket fills them nicely.
// Each svg uses a 400×400 box. Shapes are filled white so later shapes hide the lines behind them
// (like paper cut-outs); when a page is put on the canvas, white becomes see-through and only the
// lines stay (see linesOnly in draw.js).
const STYLE = 'fill="#fff" stroke="#2b2d42" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"';
const N = 'fill="none"'; // for open lines (smiles, whiskers, waves) that shouldn't hide anything

const wrap = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">${defs}<g ${STYLE}>${body}</g></svg>`;

const pt = (cx, cy, r, a) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;

function ring(cx, cy, dist, r, n, start = 0) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * Math.PI * 2;
    const [x, y] = pt(cx, cy, dist, a).split(',');
    out += `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  }
  return out;
}

function rays(cx, cy, inner, outer, n) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = Math.PI / n / 1.6;
    out += `<polygon points="${pt(cx, cy, inner, a - s)} ${pt(cx, cy, outer, a)} ${pt(cx, cy, inner, a + s)}"/>`;
  }
  return out;
}

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) pts.push(pt(cx, cy, i % 2 ? r * 0.45 : r, -Math.PI / 2 + (i * Math.PI) / 5));
  return `<polygon points="${pts.join(' ')}"/>`;
}

const waves = (y, step = 50) => {
  let d = `M10 ${y}`;
  for (let x = 10; x < 390; x += step) d += ` q${step / 2} -18 ${step} 0`;
  return `<path ${N} d="${d}"/>`;
};

export const CATEGORIES = [
  { id: 'animals', name: 'Animals', emoji: '🐾' },
  { id: 'go', name: 'Things that go', emoji: '🚗' },
  { id: 'nature', name: 'Nature', emoji: '🌳' },
  { id: 'yummy', name: 'Yummy food', emoji: '🍦' },
  { id: 'fun', name: 'Fun', emoji: '🦄' },
];

export const PAGES = [
  // ---------- Animals ----------
  {
    id: 'cat', cat: 'animals', name: 'the cat', emoji: '🐱',
    svg: wrap(`
      <polygon points="105,165 115,55 185,120"/><polygon points="295,165 285,55 215,120"/>
      <polygon points="122,140 127,85 162,118"/><polygon points="278,140 273,85 238,118"/>
      <circle cx="200" cy="225" r="115"/>
      <circle cx="158" cy="200" r="16"/><circle cx="242" cy="200" r="16"/>
      <polygon points="186,245 214,245 200,262"/>
      <path ${N} d="M200 262 q-18 26 -42 12 M200 262 q18 26 42 12"/>
      <path ${N} d="M120 250 l-70 -10 M120 265 l-68 12 M280 250 l70 -10 M280 265 l68 12"/>`),
  },
  {
    id: 'dog', cat: 'animals', name: 'the dog', emoji: '🐶',
    svg: wrap(`
      <circle cx="200" cy="210" r="105"/>
      <ellipse cx="100" cy="215" rx="38" ry="80" transform="rotate(18 100 215)"/>
      <ellipse cx="300" cy="215" rx="38" ry="80" transform="rotate(-18 300 215)"/>
      <circle cx="242" cy="180" r="30"/>
      <circle cx="160" cy="180" r="12"/><circle cx="242" cy="180" r="12"/>
      <ellipse cx="200" cy="262" rx="58" ry="42"/>
      <ellipse cx="200" cy="240" rx="20" ry="13"/>
      <path ${N} d="M200 253 v18 M200 271 q-16 16 -32 4 M200 271 q16 16 32 4"/>
      <path d="M188 280 q12 34 24 0 z"/>`),
  },
  {
    id: 'bunny', cat: 'animals', name: 'the bunny', emoji: '🐰',
    svg: wrap(`
      <ellipse cx="160" cy="115" rx="32" ry="85" transform="rotate(-10 160 115)"/>
      <ellipse cx="240" cy="115" rx="32" ry="85" transform="rotate(10 240 115)"/>
      <ellipse cx="160" cy="120" rx="14" ry="58" transform="rotate(-10 160 120)"/>
      <ellipse cx="240" cy="120" rx="14" ry="58" transform="rotate(10 240 120)"/>
      <circle cx="200" cy="255" r="100"/>
      <circle cx="165" cy="235" r="12"/><circle cx="235" cy="235" r="12"/>
      <circle cx="140" cy="280" r="16"/><circle cx="260" cy="280" r="16"/>
      <polygon points="189,265 211,265 200,278"/>
      <path ${N} d="M200 278 v12 M200 290 q-12 10 -24 2 M200 290 q12 10 24 2"/>
      <path ${N} d="M150 270 l-75 -12 M150 285 l-72 10 M250 270 l75 -12 M250 285 l72 10"/>`),
  },
  {
    id: 'bear', cat: 'animals', name: 'the bear', emoji: '🐻',
    svg: wrap(`
      <circle cx="108" cy="112" r="44"/><circle cx="292" cy="112" r="44"/>
      <circle cx="108" cy="112" r="22"/><circle cx="292" cy="112" r="22"/>
      <circle cx="200" cy="220" r="118"/>
      <circle cx="158" cy="195" r="13"/><circle cx="242" cy="195" r="13"/>
      <ellipse cx="200" cy="265" rx="55" ry="42"/>
      <ellipse cx="200" cy="247" rx="21" ry="14"/>
      <path ${N} d="M200 261 v14 M200 275 q-14 12 -27 2 M200 275 q14 12 27 2"/>`),
  },
  {
    id: 'pig', cat: 'animals', name: 'the pig', emoji: '🐷',
    svg: wrap(`
      <polygon points="105,160 118,65 182,118"/><polygon points="295,160 282,65 218,118"/>
      <circle cx="200" cy="220" r="115"/>
      <circle cx="160" cy="190" r="12"/><circle cx="240" cy="190" r="12"/>
      <circle cx="122" cy="250" r="18"/><circle cx="278" cy="250" r="18"/>
      <ellipse cx="200" cy="252" rx="55" ry="38"/>
      <ellipse cx="182" cy="252" rx="9" ry="14"/><ellipse cx="218" cy="252" rx="9" ry="14"/>
      <path ${N} d="M170 305 q30 20 60 0"/>`),
  },
  {
    id: 'duck', cat: 'animals', name: 'the duck', emoji: '🦆',
    svg: wrap(`
      <polygon points="300,240 380,195 360,280"/>
      <ellipse cx="225" cy="270" rx="140" ry="80"/>
      <polygon points="80,140 15,158 80,178"/>
      <circle cx="130" cy="150" r="65"/>
      <circle cx="122" cy="135" r="11"/>
      <path d="M190 255 Q250 210 310 248 Q270 310 195 298 Z"/>
      ${waves(375)}`),
  },
  {
    id: 'owl', cat: 'animals', name: 'the owl', emoji: '🦉',
    svg: wrap(`
      <polygon points="100,130 112,55 165,100"/><polygon points="300,130 288,55 235,100"/>
      <rect x="50" y="352" width="300" height="20" rx="10"/>
      <ellipse cx="170" cy="355" rx="22" ry="12"/><ellipse cx="230" cy="355" rx="22" ry="12"/>
      <ellipse cx="200" cy="215" rx="115" ry="140"/>
      <ellipse cx="200" cy="290" rx="70" ry="58"/>
      <ellipse cx="102" cy="250" rx="30" ry="75" transform="rotate(15 102 250)"/>
      <ellipse cx="298" cy="250" rx="30" ry="75" transform="rotate(-15 298 250)"/>
      <circle cx="155" cy="170" r="45"/><circle cx="245" cy="170" r="45"/>
      <circle cx="155" cy="170" r="18"/><circle cx="245" cy="170" r="18"/>
      <polygon points="186,205 214,205 200,238"/>`),
  },
  {
    id: 'fish', cat: 'animals', name: 'the fish', emoji: '🐟',
    svg: wrap(`
      <polygon points="285,200 375,125 375,275"/>
      <ellipse cx="175" cy="200" rx="125" ry="80"/>
      <circle cx="105" cy="180" r="15"/>
      <path d="M150 200 q30 -40 60 0 q-30 40 -60 0z"/>
      <circle cx="60" cy="90" r="14"/><circle cx="90" cy="55" r="10"/><circle cx="120" cy="80" r="8"/>`),
  },
  {
    id: 'turtle', cat: 'animals', name: 'the turtle', emoji: '🐢',
    svg: wrap(`
      <polygon points="72,250 32,268 72,272"/>
      <ellipse cx="118" cy="290" rx="26" ry="34"/><ellipse cx="282" cy="290" rx="26" ry="34"/>
      <circle cx="342" cy="238" r="40"/>
      <path d="M80 255 A120 120 0 0 1 320 255 Z"/>
      <polygon points="200,165 240,185 240,225 200,245 160,225 160,185"/>
      <path ${N} d="M200 165 V135 M160 185 L140 151 M240 185 L260 151 M160 225 L104 183 M240 225 L296 183"/>
      <rect x="65" y="245" width="270" height="26" rx="13"/>
      <circle cx="356" cy="228" r="7"/>
      <path ${N} d="M350 255 q14 6 26 -4"/>`),
  },
  {
    id: 'butterfly', cat: 'animals', name: 'the butterfly', emoji: '🦋',
    svg: wrap(`
      <path ${N} d="M192 115 q-20 -50 -45 -60 M208 115 q20 -50 45 -60"/>
      <circle cx="143" cy="52" r="9"/><circle cx="257" cy="52" r="9"/>
      <ellipse cx="128" cy="150" rx="75" ry="62" transform="rotate(-20 128 150)"/>
      <ellipse cx="272" cy="150" rx="75" ry="62" transform="rotate(20 272 150)"/>
      <ellipse cx="140" cy="262" rx="58" ry="46" transform="rotate(20 140 262)"/>
      <ellipse cx="260" cy="262" rx="58" ry="46" transform="rotate(-20 260 262)"/>
      <circle cx="118" cy="150" r="22"/><circle cx="282" cy="150" r="22"/>
      <circle cx="140" cy="265" r="15"/><circle cx="260" cy="265" r="15"/>
      <ellipse cx="200" cy="205" rx="16" ry="95"/>`),
  },
  {
    id: 'ladybug', cat: 'animals', name: 'the ladybug', emoji: '🐞',
    svg: wrap(`
      <path ${N} d="M95 200 L45 182 M82 250 L32 255 M95 300 L48 328 M305 200 L355 182 M318 250 L368 255 M305 300 L352 328"/>
      <path ${N} d="M185 70 q-15 -35 -45 -40 M215 70 q15 -35 45 -40"/>
      <circle cx="140" cy="30" r="10"/><circle cx="260" cy="30" r="10"/>
      <circle cx="200" cy="112" r="52"/>
      <circle cx="200" cy="235" r="125"/>
      <path ${N} d="M200 110 V360"/>
      <circle cx="150" cy="190" r="22"/><circle cx="250" cy="190" r="22"/>
      <circle cx="132" cy="262" r="20"/><circle cx="268" cy="262" r="20"/>
      <circle cx="165" cy="322" r="15"/><circle cx="235" cy="322" r="15"/>
      <circle cx="180" cy="88" r="9"/><circle cx="220" cy="88" r="9"/>`),
  },
  {
    id: 'snail', cat: 'animals', name: 'the snail', emoji: '🐌',
    svg: wrap(`
      <path ${N} d="M80 250 L62 175 M108 248 L122 178"/>
      <circle cx="62" cy="168" r="13"/><circle cx="122" cy="172" r="13"/>
      <path d="M40 310 C38 255 75 228 110 245 L330 255 Q385 262 378 310 Z"/>
      <circle cx="245" cy="180" r="100"/>
      <path ${N} d="M245 180 m-18 0 a18 18 0 1 1 36 0 a36 36 0 1 1 -72 0 a54 54 0 1 1 108 0 a72 72 0 1 1 -144 0"/>
      <circle cx="68" cy="275" r="7"/>
      <path ${N} d="M55 292 q14 10 28 0"/>`),
  },

  // ---------- Things that go ----------
  {
    id: 'car', cat: 'go', name: 'the car', emoji: '🚗',
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
    id: 'train', cat: 'go', name: 'the train', emoji: '🚂',
    svg: wrap(`
      <circle cx="110" cy="80" r="18"/><circle cx="140" cy="52" r="24"/><circle cx="182" cy="34" r="26"/>
      <rect x="85" y="128" width="40" height="70"/>
      <polygon points="72,128 138,128 128,104 82,104"/>
      <rect x="55" y="190" width="160" height="92" rx="10"/>
      <rect x="205" y="120" width="125" height="162"/>
      <rect x="192" y="102" width="150" height="22" rx="8"/>
      <rect x="228" y="145" width="80" height="62" rx="8"/>
      <polygon points="55,282 20,326 55,326"/>
      <rect x="40" y="276" width="305" height="30" rx="6"/>
      <circle cx="105" cy="330" r="36"/><circle cx="200" cy="330" r="36"/><circle cx="292" cy="334" r="30"/>
      <circle cx="105" cy="330" r="11"/><circle cx="200" cy="330" r="11"/><circle cx="292" cy="334" r="9"/>
      <path ${N} d="M10 372 H390"/>`),
  },
  {
    id: 'rocket', cat: 'go', name: 'the rocket', emoji: '🚀',
    svg: wrap(`
      <path d="M155 295 Q200 395 245 295 Z"/>
      <path d="M178 295 Q200 350 222 295 Z"/>
      <polygon points="142,228 85,322 148,300"/><polygon points="258,228 315,322 252,300"/>
      <path d="M200 35 C262 88 272 182 260 300 L140 300 C128 182 138 88 200 35 Z"/>
      <circle cx="200" cy="155" r="40"/><circle cx="200" cy="155" r="24"/>
      <rect x="150" y="238" width="100" height="22" rx="8"/>
      ${star(60, 70, 26)}${star(345, 110, 22)}${star(330, 360, 18)}${star(55, 330, 16)}`),
  },
  {
    id: 'boat', cat: 'go', name: 'the boat', emoji: '⛵',
    svg: wrap(`
      <circle cx="345" cy="65" r="30"/>
      <path ${N} d="M200 250 V58"/>
      <polygon points="200,58 242,72 200,86"/>
      <polygon points="208,95 208,238 325,238"/>
      <polygon points="192,105 192,238 95,238"/>
      <path d="M40 250 L360 250 L310 320 L90 320 Z"/>
      <circle cx="145" cy="285" r="12"/><circle cx="200" cy="285" r="12"/><circle cx="255" cy="285" r="12"/>
      ${waves(345)}${waves(380)}`),
  },
  {
    id: 'plane', cat: 'go', name: 'the airplane', emoji: '✈️',
    svg: wrap(`
      <circle cx="80" cy="320" r="28"/><circle cx="115" cy="310" r="34"/><circle cx="150" cy="325" r="24"/>
      <circle cx="290" cy="80" r="24"/><circle cx="320" cy="68" r="30"/><circle cx="352" cy="82" r="22"/>
      <polygon points="70,190 45,105 100,105 130,180"/>
      <ellipse cx="210" cy="200" rx="172" ry="40"/>
      <path d="M338 182 Q362 185 374 200 L338 200 Z"/>
      <circle cx="245" cy="192" r="10"/><circle cx="275" cy="192" r="10"/><circle cx="305" cy="192" r="10"/>
      <polygon points="175,208 250,208 205,300 145,300"/>
      <polygon points="70,210 115,210 95,252 62,252"/>`),
  },
  {
    id: 'balloon', cat: 'go', name: 'the hot air balloon', emoji: '🎈',
    svg: wrap(
      `
      <path ${N} d="M150 255 L172 318 M250 255 L228 318"/>
      <path d="M200 30 C305 30 330 140 290 210 L250 262 L150 262 L110 210 C70 140 95 30 200 30 Z"/>
      <g clip-path="url(#envelope)"><path ${N} d="M200 20 C160 80 160 200 175 270 M200 20 C240 80 240 200 225 270 M60 160 Q200 190 340 160"/></g>
      <rect x="165" y="315" width="70" height="55" rx="8"/>
      <path ${N} d="M165 335 H235"/>`,
      `<defs><clipPath id="envelope"><path d="M200 30 C305 30 330 140 290 210 L250 262 L150 262 L110 210 C70 140 95 30 200 30 Z"/></clipPath></defs>`,
    ),
  },

  // ---------- Nature ----------
  {
    id: 'flower', cat: 'nature', name: 'the flower', emoji: '🌸',
    svg: wrap(`
      <path ${N} d="M200 190 V380"/>
      <ellipse cx="150" cy="300" rx="45" ry="20" transform="rotate(-30 150 300)"/>
      <ellipse cx="250" cy="320" rx="45" ry="20" transform="rotate(30 250 320)"/>
      ${ring(200, 140, 72, 44, 6)}
      <circle cx="200" cy="140" r="40"/>`),
  },
  {
    id: 'sun', cat: 'nature', name: 'the sun', emoji: '☀️',
    svg: wrap(`
      ${rays(200, 200, 100, 180, 10)}
      <circle cx="200" cy="200" r="92"/>
      <circle cx="168" cy="180" r="12"/><circle cx="232" cy="180" r="12"/>
      <path ${N} d="M155 225 q45 45 90 0"/>`),
  },
  {
    id: 'rainbow', cat: 'nature', name: 'the rainbow', emoji: '🌈',
    svg: wrap(`
      ${[175, 145, 115, 85].map((r) => `<path ${N} d="M${200 - r} 300 A${r} ${r} 0 0 1 ${200 + r} 300"/>`).join('')}
      <path ${N} d="M25 300 H375"/>
      <circle cx="45" cy="315" r="35"/><circle cx="85" cy="320" r="30"/><circle cx="60" cy="290" r="25"/>
      <circle cx="315" cy="320" r="30"/><circle cx="355" cy="315" r="35"/><circle cx="340" cy="290" r="25"/>`),
  },
  {
    id: 'tree', cat: 'nature', name: 'the apple tree', emoji: '🌳',
    svg: wrap(`
      <path d="M175 230 L168 360 L232 360 L225 230 Z"/>
      <circle cx="120" cy="190" r="62"/><circle cx="280" cy="190" r="62"/>
      <circle cx="200" cy="130" r="88"/><circle cx="200" cy="215" r="66"/>
      <circle cx="160" cy="135" r="13"/><circle cx="245" cy="115" r="13"/><circle cx="125" cy="205" r="13"/>
      <circle cx="275" cy="200" r="13"/><circle cx="210" cy="215" r="13"/>
      <path ${N} d="M30 362 H370"/>`),
  },
  {
    id: 'mushroom', cat: 'nature', name: 'the mushroom', emoji: '🍄',
    svg: wrap(`
      <path d="M165 225 L150 350 Q200 368 250 350 L235 225 Z"/>
      <path d="M185 348 V312 a15 15 0 0 1 30 0 V348 Z"/>
      <path d="M45 240 Q55 85 200 75 Q345 85 355 240 Z"/>
      <circle cx="125" cy="175" r="24"/><circle cx="200" cy="125" r="22"/><circle cx="275" cy="175" r="24"/>
      <circle cx="200" cy="205" r="18"/>
      <path ${N} d="M25 365 l14 -26 l10 26 l12 -20 l10 20 M320 365 l12 -22 l10 22 l12 -18 l8 18"/>`),
  },
  {
    id: 'house', cat: 'nature', name: 'the house', emoji: '🏠',
    svg: wrap(`
      <rect x="258" y="80" width="38" height="70"/>
      <rect x="90" y="185" width="220" height="180"/>
      <polygon points="65,195 200,70 335,195"/>
      <rect x="170" y="275" width="60" height="90"/>
      <rect x="110" y="215" width="50" height="50"/><rect x="240" y="215" width="50" height="50"/>
      <path ${N} d="M135 215 V265 M110 240 H160 M265 215 V265 M240 240 H290"/>
      <path ${N} d="M20 365 H380"/>`),
  },
  {
    id: 'castle', cat: 'nature', name: 'the castle', emoji: '🏰',
    svg: wrap(`
      <path ${N} d="M85 62 V25 M315 62 V25"/>
      <polygon points="85,25 117,36 85,47"/><polygon points="315,25 347,36 315,47"/>
      <rect x="118" y="160" width="24" height="25"/><rect x="160" y="160" width="24" height="25"/>
      <rect x="202" y="160" width="24" height="25"/><rect x="244" y="160" width="24" height="25"/>
      <rect x="110" y="180" width="180" height="182"/>
      <rect x="50" y="128" width="72" height="234"/><rect x="278" y="128" width="72" height="234"/>
      <polygon points="38,132 86,58 134,132"/><polygon points="266,132 314,58 362,132"/>
      <rect x="73" y="172" width="26" height="42" rx="13"/><rect x="301" y="172" width="26" height="42" rx="13"/>
      <circle cx="200" cy="228" r="20"/>
      <path d="M168 362 V292 a32 32 0 0 1 64 0 V362 Z"/>
      <path ${N} d="M20 362 H380"/>`),
  },

  // ---------- Yummy food ----------
  {
    id: 'icecream', cat: 'yummy', name: 'the ice cream', emoji: '🍦',
    svg: wrap(
      `
      <polygon points="138,200 262,200 200,378"/>
      <g clip-path="url(#cone)"><path ${N} d="M100 190 L300 330 M100 250 L300 390 M300 190 L100 330 M300 250 L100 390"/></g>
      <circle cx="158" cy="168" r="55"/><circle cx="242" cy="168" r="55"/>
      <circle cx="200" cy="112" r="60"/>
      <path ${N} d="M200 38 q6 -22 22 -26"/>
      <circle cx="200" cy="48" r="15"/>`,
      `<defs><clipPath id="cone"><polygon points="138,200 262,200 200,378"/></clipPath></defs>`,
    ),
  },
  {
    id: 'cupcake', cat: 'yummy', name: 'the cupcake', emoji: '🧁',
    svg: wrap(
      `
      <polygon points="110,230 290,230 265,365 135,365"/>
      <g clip-path="url(#wrapper)"><path ${N} d="M155 220 L165 370 M200 220 V370 M245 220 L235 370"/></g>
      <circle cx="132" cy="218" r="40"/><circle cx="268" cy="218" r="40"/>
      <circle cx="165" cy="180" r="46"/><circle cx="235" cy="180" r="46"/>
      <circle cx="200" cy="140" r="50"/>
      <path ${N} d="M200 92 q4 -24 20 -30"/>
      <circle cx="200" cy="96" r="18"/>
      <path ${N} d="M155 170 l12 -6 M230 160 l12 6 M185 210 l-4 12 M250 205 l10 6 M130 215 l12 2"/>`,
      `<defs><clipPath id="wrapper"><polygon points="110,230 290,230 265,365 135,365"/></clipPath></defs>`,
    ),
  },
  {
    id: 'cake', cat: 'yummy', name: 'the birthday cake', emoji: '🎂',
    svg: wrap(`
      <ellipse cx="200" cy="362" rx="175" ry="20"/>
      <path d="M158 118 q-13 -18 0 -34 q13 16 0 34 Z"/><path d="M200 118 q-13 -18 0 -34 q13 16 0 34 Z"/><path d="M242 118 q-13 -18 0 -34 q13 16 0 34 Z"/>
      <rect x="150" y="122" width="16" height="55"/><rect x="192" y="122" width="16" height="55"/><rect x="234" y="122" width="16" height="55"/>
      <rect x="60" y="250" width="280" height="110" rx="10"/>
      <rect x="110" y="170" width="180" height="85" rx="10"/>
      <path ${N} d="M60 285 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0 q20 22 40 0"/>
      <path ${N} d="M110 200 q15 18 30 0 q15 18 30 0 q15 18 30 0 q15 18 30 0 q15 18 30 0 q15 18 30 0"/>
      <circle cx="120" cy="325" r="10"/><circle cx="200" cy="330" r="10"/><circle cx="280" cy="325" r="10"/>`),
  },
  {
    id: 'apple', cat: 'yummy', name: 'the apple', emoji: '🍎',
    svg: wrap(`
      <rect x="192" y="58" width="16" height="58" rx="6"/>
      <path d="M200 112 C120 62 40 122 60 230 C80 330 160 372 200 345 C240 372 320 330 340 230 C360 122 280 62 200 112 Z"/>
      <path d="M212 88 Q262 40 305 70 Q262 108 212 88 Z"/>
      <path ${N} d="M110 170 q-12 40 4 72"/>`),
  },
  {
    id: 'watermelon', cat: 'yummy', name: 'the watermelon', emoji: '🍉',
    svg: wrap(`
      <path d="M30 150 A170 170 0 0 0 370 150 Z"/>
      <path d="M58 150 A142 142 0 0 0 342 150 Z"/>
      ${[[120, 200], [170, 235], [230, 235], [280, 200], [200, 195], [145, 175], [255, 175]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="12"/>`)
        .join('')}`),
  },

  // ---------- Fun ----------
  {
    id: 'unicorn', cat: 'fun', name: 'the unicorn', emoji: '🦄',
    svg: wrap(
      `
      <polygon points="122,150 110,72 168,118"/><polygon points="278,150 290,72 232,118"/>
      <circle cx="105" cy="205" r="30"/><circle cx="96" cy="255" r="28"/><circle cx="104" cy="303" r="26"/>
      <ellipse cx="200" cy="230" rx="105" ry="118"/>
      <circle cx="160" cy="138" r="26"/><circle cx="240" cy="138" r="26"/><circle cx="200" cy="128" r="30"/>
      <polygon points="178,128 200,22 222,128"/>
      <g clip-path="url(#horn)"><path ${N} d="M170 112 L230 92 M170 80 L230 60 M170 48 L230 28"/></g>
      <path ${N} d="M150 218 q15 -16 30 0 M220 218 q15 -16 30 0"/>
      <circle cx="140" cy="262" r="15"/><circle cx="260" cy="262" r="15"/>
      <ellipse cx="200" cy="300" rx="70" ry="44"/>
      <ellipse cx="178" cy="298" rx="7" ry="11"/><ellipse cx="222" cy="298" rx="7" ry="11"/>
      <path ${N} d="M180 325 q20 12 40 0"/>`,
      `<defs><clipPath id="horn"><polygon points="178,128 200,22 222,128"/></clipPath></defs>`,
    ),
  },
  {
    id: 'robot', cat: 'fun', name: 'the robot', emoji: '🤖',
    svg: wrap(`
      <path ${N} d="M200 90 V50"/><circle cx="200" cy="40" r="14"/>
      <rect x="112" y="120" width="20" height="42" rx="6"/><rect x="268" y="120" width="20" height="42" rx="6"/>
      <rect x="140" y="325" width="42" height="45" rx="8"/><rect x="218" y="325" width="42" height="45" rx="8"/>
      <rect x="68" y="215" width="44" height="92" rx="20"/><rect x="288" y="215" width="44" height="92" rx="20"/>
      <rect x="180" y="185" width="40" height="25"/>
      <rect x="110" y="205" width="180" height="130" rx="14"/>
      <rect x="130" y="90" width="140" height="100" rx="16"/>
      <circle cx="170" cy="135" r="18"/><circle cx="230" cy="135" r="18"/>
      <rect x="165" y="163" width="70" height="14" rx="7"/>
      <rect x="148" y="228" width="104" height="66" rx="8"/>
      <circle cx="175" cy="261" r="12"/><circle cx="225" cy="261" r="12"/>`),
  },
  {
    id: 'dino', cat: 'fun', name: 'the dinosaur', emoji: '🦕',
    svg: wrap(`
      <path d="M325 225 Q392 250 395 305 Q360 272 318 282 Z"/>
      <rect x="135" y="270" width="38" height="78" rx="12"/><rect x="185" y="280" width="38" height="70" rx="12"/>
      <rect x="250" y="280" width="38" height="70" rx="12"/><rect x="295" y="270" width="38" height="78" rx="12"/>
      <path d="M112 245 Q72 150 98 82 L152 86 Q132 155 178 228 Z"/>
      <ellipse cx="230" cy="250" rx="122" ry="72"/>
      <ellipse cx="122" cy="72" rx="56" ry="36"/>
      <circle cx="112" cy="60" r="8"/>
      <path ${N} d="M80 85 q18 14 36 4"/>
      <circle cx="205" cy="232" r="17"/><circle cx="260" cy="255" r="13"/><circle cx="240" cy="210" r="10"/>
      <path ${N} d="M10 352 H390"/>`),
  },
  {
    id: 'snowman', cat: 'fun', name: 'the snowman', emoji: '⛄',
    svg: wrap(`
      <path ${N} d="M150 190 L80 140 M95 152 l-22 -2 M250 190 L320 140 M305 152 l22 -2"/>
      <circle cx="200" cy="295" r="78"/>
      <circle cx="200" cy="188" r="58"/>
      <circle cx="200" cy="102" r="44"/>
      <rect x="160" y="138" width="80" height="18" rx="9"/><rect x="208" y="146" width="20" height="50" rx="7"/>
      <rect x="166" y="22" width="68" height="50" rx="4"/><rect x="148" y="66" width="104" height="14" rx="7"/>
      <circle cx="184" cy="98" r="6"/><circle cx="216" cy="98" r="6"/>
      <polygon points="200,108 245,116 200,124"/>
      <circle cx="200" cy="180" r="8"/><circle cx="200" cy="210" r="8"/><circle cx="200" cy="270" r="9"/><circle cx="200" cy="305" r="9"/>
      <path ${N} d="M15 372 Q100 355 200 370 T385 365"/>`),
  },
  {
    id: 'crown', cat: 'fun', name: 'the crown', emoji: '👑',
    svg: wrap(`
      <polygon points="60,300 50,120 125,200 200,90 275,200 350,120 340,300"/>
      <rect x="55" y="295" width="290" height="50" rx="10"/>
      <circle cx="50" cy="112" r="16"/><circle cx="200" cy="80" r="18"/><circle cx="350" cy="112" r="16"/>
      <circle cx="200" cy="230" r="28"/>
      <polygon points="118,250 138,230 158,250 138,270"/><polygon points="242,250 262,230 282,250 262,270"/>
      <circle cx="110" cy="320" r="10"/><circle cx="160" cy="320" r="10"/><circle cx="200" cy="320" r="10"/>
      <circle cx="240" cy="320" r="10"/><circle cx="290" cy="320" r="10"/>`),
  },

  // ---------- Bonus pages (unlocked with stars; see js/rewards.js) ----------
  {
    id: 'sparkle', cat: 'fun', bonus: true, name: 'Sparkle the unicorn', emoji: '🦄',
    svg: wrap(`
      <g transform="translate(8 40) scale(1.72)" stroke-width="4.5">
        <path d="M52 128 C20 120 14 150 30 168 C18 170 20 190 40 186 C50 176 62 150 58 132 Z"/>
        <path d="M50 134 C30 132 28 152 38 162 C44 156 54 146 52 136 Z"/>
        <rect x="68" y="150" width="20" height="42" rx="9"/><rect x="128" y="150" width="20" height="42" rx="9"/>
        <rect x="66" y="182" width="24" height="14" rx="6"/><rect x="126" y="182" width="24" height="14" rx="6"/>
        <ellipse cx="106" cy="140" rx="62" ry="38"/>
        <rect x="90" y="150" width="18" height="38" rx="8"/><rect x="146" y="148" width="18" height="40" rx="8"/>
        <rect x="88" y="180" width="22" height="13" rx="6"/><rect x="144" y="180" width="22" height="13" rx="6"/>
        <path d="M118 120 C112 100 118 82 132 76 L160 112 Z"/>
        <circle cx="112" cy="58" r="16"/><circle cx="104" cy="78" r="15"/><circle cx="104" cy="98" r="14"/><circle cx="110" cy="116" r="12"/>
        <polygon points="126,50 132,22 146,46"/>
        <ellipse cx="148" cy="78" rx="36" ry="32"/>
        <polygon points="150,48 168,4 172,50"/>
        <path ${N} d="M155 38 L170 32 M158 28 L169 22"/>
        <circle cx="124" cy="56" r="13"/>
        <ellipse cx="170" cy="96" rx="26" ry="18"/>
        <circle cx="165" cy="94" r="2.5"/><circle cx="180" cy="94" r="2.5"/>
        <path ${N} d="M160 104 Q170 112 182 104"/>
        <ellipse cx="146" cy="74" rx="7" ry="10"/>
      </g>
      ${star(345, 60, 26)}${star(60, 70, 20)}${star(350, 330, 18)}`),
  },
  {
    id: 'mermaid', cat: 'fun', bonus: true, name: 'the mermaid', emoji: '🧜',
    svg: wrap(
      `
      <path d="M138 95 C112 180 122 245 150 268 L250 268 C278 245 288 180 262 95 Z"/>
      <path d="M250 328 C270 292 322 298 334 316 C312 322 292 332 272 342 C302 348 322 368 316 388 C290 378 266 362 250 338 Z"/>
      <path d="M163 238 C156 300 198 334 258 334 C232 300 236 268 237 238 Z"/>
      <g clip-path="url(#tail)"><path ${N} d="M160 260 q12 12 24 0 q12 12 24 0 q12 12 24 0 M165 285 q12 12 24 0 q12 12 24 0 q12 12 24 0 M185 310 q12 12 24 0 q12 12 24 0"/></g>
      <ellipse cx="148" cy="210" rx="14" ry="40" transform="rotate(20 148 210)"/>
      <ellipse cx="252" cy="210" rx="14" ry="40" transform="rotate(-20 252 210)"/>
      <path d="M165 240 C160 200 170 172 200 166 C230 172 240 200 235 240 Z"/>
      <circle cx="184" cy="200" r="15"/><circle cx="216" cy="200" r="15"/>
      <circle cx="200" cy="112" r="50"/>
      <path d="M150 108 C160 66 240 66 250 108 C232 92 216 96 200 102 C184 96 168 92 150 108 Z"/>
      ${star(245, 76, 18)}
      <circle cx="182" cy="118" r="7"/><circle cx="218" cy="118" r="7"/>
      <path ${N} d="M184 140 q16 14 32 0"/>
      <circle cx="80" cy="120" r="14"/><circle cx="60" cy="80" r="10"/><circle cx="330" cy="150" r="12"/><circle cx="345" cy="110" r="8"/>`,
      `<defs><clipPath id="tail"><path d="M163 238 C156 300 198 334 258 334 C232 300 236 268 237 238 Z"/></clipPath></defs>`,
    ),
  },
  {
    id: 'dragon', cat: 'fun', bonus: true, name: 'the friendly dragon', emoji: '🐉',
    svg: wrap(
      `
      <path d="M255 205 L340 115 L330 170 L375 160 L338 220 Z"/>
      <path d="M290 310 C352 330 372 290 378 250 L396 272 L388 240 L362 250 C356 292 332 302 296 290 Z"/>
      ${[[230, 178], [262, 188], [290, 205], [312, 228]].map(([x, y]) => `<polygon points="${x - 14},${y + 8} ${x},${y - 18} ${x + 14},${y + 8}"/>`).join('')}
      <ellipse cx="215" cy="265" rx="100" ry="88"/>
      <ellipse cx="210" cy="285" rx="56" ry="62"/>
      <g clip-path="url(#belly)"><path ${N} d="M150 250 H270 M150 280 H270 M150 310 H270"/></g>
      <ellipse cx="160" cy="352" rx="34" ry="16"/><ellipse cx="265" cy="352" rx="34" ry="16"/>
      <polygon points="150,90 160,45 180,85"/><polygon points="195,85 215,42 222,88"/>
      <ellipse cx="180" cy="125" rx="66" ry="56"/>
      <ellipse cx="118" cy="142" rx="38" ry="30"/>
      <circle cx="106" cy="136" r="4"/><circle cx="124" cy="132" r="4"/>
      <circle cx="190" cy="112" r="15"/><circle cx="194" cy="108" r="5"/>
      <path ${N} d="M100 156 q20 14 42 4"/>
      <circle cx="68" cy="110" r="12"/><circle cx="48" cy="90" r="9"/><circle cx="36" cy="66" r="6"/>`,
      `<defs><clipPath id="belly"><ellipse cx="210" cy="285" rx="56" ry="62"/></clipPath></defs>`,
    ),
  },
  {
    id: 'fairy', cat: 'fun', bonus: true, name: 'the fairy', emoji: '🧚',
    svg: wrap(`
      <ellipse cx="140" cy="175" rx="62" ry="40" transform="rotate(-30 140 175)"/>
      <ellipse cx="260" cy="175" rx="62" ry="40" transform="rotate(30 260 175)"/>
      <ellipse cx="150" cy="245" rx="44" ry="28" transform="rotate(25 150 245)"/>
      <ellipse cx="250" cy="245" rx="44" ry="28" transform="rotate(-25 250 245)"/>
      <rect x="180" y="300" width="14" height="60" rx="6"/><rect x="206" y="300" width="14" height="60" rx="6"/>
      <ellipse cx="183" cy="362" rx="18" ry="10"/><ellipse cx="217" cy="362" rx="18" ry="10"/>
      <path ${N} d="M178 190 L140 240 M222 190 L268 168"/>
      <path ${N} d="M268 168 L300 120"/>
      ${star(305, 110, 22)}
      <path d="M178 170 L222 170 L262 315 Q248 300 232 316 Q216 300 200 316 Q184 300 168 316 Q152 300 138 315 Z"/>
      <circle cx="200" cy="110" r="56"/>
      <circle cx="200" cy="118" r="42"/>
      <path d="M158 112 C166 80 234 80 242 112 C226 98 214 102 200 106 C186 102 174 98 158 112 Z"/>
      <polygon points="182,72 190,52 200,68 210,52 218,72"/>
      <circle cx="186" cy="122" r="6"/><circle cx="214" cy="122" r="6"/>
      <path ${N} d="M188 140 q12 10 24 0"/>
      ${star(80, 330, 14)}${star(330, 300, 12)}${star(70, 90, 12)}`),
  },
];

export function findPage(id) {
  return PAGES.find((p) => p.id === id) || null;
}

export const pageURL = (page) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(page.svg)}`;

// Resolves to an <img> ready to draw onto a canvas.
export function pageImage(page) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = pageURL(page);
  });
}
