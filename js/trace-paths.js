// How to write each letter and number, one entry per pen stroke, in the order she should draw them.
// Coordinates are in a 100 × 140 box: top line y=10, middle (dashed) line y=50, baseline y=110,
// and tails (g, j, p, q, y) hang down to y=140. Paths use absolute M / L / Q / C commands.
const CIRCLE = 'M75 62 C68 46 30 45 26 78 C22 113 70 117 75 88'; // the "a / d / g / q" circle
const HUMP = (x1, x2) => `M${x1} 75 C${x1 + 4} 45 ${x2} 45 ${x2} 75 L${x2} 110`;
const BOWL = 'M25 82 C25 40 80 40 80 80 C80 120 25 120 25 86'; // b / p

export const GLYPHS = {
  // Big letters
  A: ['M50 10 L15 110', 'M50 10 L85 110', 'M29 72 L71 72'],
  B: ['M22 10 L22 110', 'M22 10 L52 10 C80 10 80 58 52 58 L22 58', 'M22 58 L56 58 C88 58 88 110 56 110 L22 110'],
  C: ['M82 28 C70 4 28 4 18 38 C8 70 22 110 50 110 C68 110 78 100 83 90'],
  D: ['M22 10 L22 110', 'M22 10 L45 10 C96 10 96 110 45 110 L22 110'],
  E: ['M24 10 L24 110', 'M24 10 L80 10', 'M24 60 L70 60', 'M24 110 L80 110'],
  F: ['M26 10 L26 110', 'M26 10 L82 10', 'M26 60 L72 60'],
  G: ['M82 28 C70 4 28 4 18 38 C8 70 22 110 50 110 C72 110 82 96 82 70 L56 70'],
  H: ['M20 10 L20 110', 'M80 10 L80 110', 'M20 60 L80 60'],
  I: ['M50 10 L50 110', 'M28 10 L72 10', 'M28 110 L72 110'],
  J: ['M66 10 L66 84 C66 116 24 116 22 88'],
  K: ['M24 10 L24 110', 'M78 10 L24 68', 'M44 50 L80 110'],
  L: ['M26 10 L26 110 L80 110'],
  M: ['M14 10 L14 110', 'M14 10 L50 76 L86 10 L86 110'],
  N: ['M20 10 L20 110', 'M20 10 L80 110 L80 10'],
  O: ['M50 10 C4 10 4 110 50 110 C96 110 96 10 50 10'],
  P: ['M24 10 L24 110', 'M24 10 L54 10 C88 10 88 64 54 64 L24 64'],
  Q: ['M50 10 C4 10 4 110 50 110 C96 110 96 10 50 10', 'M58 80 L86 114'],
  R: ['M24 10 L24 110', 'M24 10 L54 10 C88 10 88 64 54 64 L24 64', 'M50 64 L82 110'],
  S: ['M80 26 C70 4 22 4 22 32 C22 58 80 54 80 84 C80 114 24 116 18 92'],
  T: ['M14 10 L86 10', 'M50 10 L50 110'],
  U: ['M20 10 L20 78 C20 118 80 118 80 78 L80 10'],
  V: ['M14 10 L50 110 L86 10'],
  W: ['M6 10 L27 110 L50 42 L73 110 L94 10'],
  X: ['M18 10 L82 110', 'M82 10 L18 110'],
  Y: ['M16 10 L50 60', 'M84 10 L50 60', 'M50 60 L50 110'],
  Z: ['M18 10 L82 10 L18 110 L82 110'],

  // Little letters
  a: [CIRCLE, 'M75 50 L75 110'],
  b: ['M25 10 L25 110', BOWL],
  c: ['M76 62 C66 44 24 44 24 80 C24 118 68 116 77 98'],
  d: [CIRCLE, 'M75 10 L75 110'],
  e: ['M25 80 L75 80 C75 44 25 44 25 80 C25 118 68 116 77 100'],
  f: ['M72 20 C64 6 44 6 44 30 L44 110', 'M24 52 L66 52'],
  g: [CIRCLE, 'M75 50 L75 124 C75 143 34 143 28 128'],
  h: ['M25 10 L25 110', HUMP(25, 75)],
  i: ['M50 50 L50 110', 'M50 28 L50 30'],
  j: ['M56 50 L56 124 C56 143 26 143 22 128', 'M56 28 L56 30'],
  k: ['M28 10 L28 110', 'M74 50 L28 86', 'M44 74 L76 110'],
  l: ['M50 10 L50 110'],
  m: ['M14 50 L14 110', HUMP(14, 49), HUMP(49, 86)],
  n: ['M25 50 L25 110', HUMP(25, 75)],
  o: ['M50 50 C16 50 16 110 50 110 C84 110 84 50 50 50'],
  p: ['M25 50 L25 140', BOWL],
  q: [CIRCLE, 'M75 50 L75 140'],
  r: ['M30 50 L30 110', 'M30 78 C34 52 56 44 74 56'],
  s: ['M72 58 C64 43 30 43 30 63 C30 82 72 76 72 95 C72 117 31 117 25 100'],
  t: ['M46 18 L46 110', 'M24 52 L70 52'],
  u: ['M25 50 L25 84 C25 119 75 119 75 84', 'M75 50 L75 110'],
  v: ['M20 50 L50 110 L80 50'],
  w: ['M8 50 L28 110 L50 62 L72 110 L92 50'],
  x: ['M25 50 L75 110', 'M75 50 L25 110'],
  y: ['M20 50 L50 110', 'M80 50 L36 140'],
  z: ['M24 50 L76 50 L24 110 L76 110'],

  // Numbers
  0: ['M50 10 C10 10 10 110 50 110 C90 110 90 10 50 10'],
  1: ['M34 28 L52 10 L52 110'],
  2: ['M22 32 C24 4 78 4 78 34 C78 58 40 80 20 110 L82 110'],
  3: ['M22 24 C34 3 78 5 76 32 C75 52 56 58 46 58 C70 58 82 70 80 88 C78 116 30 116 20 96'],
  4: ['M52 10 L16 80 L86 80', 'M64 10 L64 110'],
  5: ['M30 10 L26 56 C42 42 80 46 80 78 C80 116 30 116 20 96', 'M30 10 L76 10'],
  6: ['M72 16 C40 4 20 40 20 76 C20 112 80 112 80 80 C80 50 30 50 22 76'],
  7: ['M18 10 L82 10 L38 110'],
  8: ['M72 28 C72 4 28 4 28 28 C28 50 72 58 72 85 C72 116 28 116 28 85 C28 58 72 50 72 28'],
  9: ['M78 38 C72 8 24 8 24 40 C24 72 78 72 78 40 L78 110'],
};

// Turns one stroke into evenly spaced points (every `step` units), so tracing can follow along.
export function strokePoints(d, step = 2.5) {
  const nums = d.match(/[MLQC]|-?\d+(\.\d+)?/g);
  const dense = [];
  let i = 0;
  let cmd = 'M';
  let x = 0;
  let y = 0;
  const n = () => Number(nums[i++]);
  while (i < nums.length) {
    if (/[MLQC]/.test(nums[i])) cmd = nums[i++];
    if (cmd === 'M') {
      x = n();
      y = n();
      dense.push([x, y]);
      cmd = 'L';
    } else if (cmd === 'L') {
      const [x1, y1] = [n(), n()];
      for (let t = 1; t <= 20; t++) dense.push([x + ((x1 - x) * t) / 20, y + ((y1 - y) * t) / 20]);
      [x, y] = [x1, y1];
    } else if (cmd === 'Q') {
      const [cx, cy, x1, y1] = [n(), n(), n(), n()];
      for (let t = 1; t <= 30; t++) {
        const u = t / 30;
        const a = (1 - u) ** 2, b = 2 * (1 - u) * u, c = u * u;
        dense.push([a * x + b * cx + c * x1, a * y + b * cy + c * y1]);
      }
      [x, y] = [x1, y1];
    } else if (cmd === 'C') {
      const [c1x, c1y, c2x, c2y, x1, y1] = [n(), n(), n(), n(), n(), n()];
      for (let t = 1; t <= 40; t++) {
        const u = t / 40;
        const a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c = 3 * (1 - u) * u * u, e = u ** 3;
        dense.push([a * x + b * c1x + c * c2x + e * x1, a * y + b * c1y + c * c2y + e * y1]);
      }
      [x, y] = [x1, y1];
    }
  }
  // Resample by distance along the line.
  const out = [dense[0]];
  let carry = 0;
  for (let k = 1; k < dense.length; k++) {
    let [ax, ay] = dense[k - 1];
    const [bx, by] = dense[k];
    let seg = Math.hypot(bx - ax, by - ay);
    while (carry + seg >= step) {
      const t = (step - carry) / seg;
      ax += (bx - ax) * t;
      ay += (by - ay) * t;
      out.push([ax, ay]);
      seg = Math.hypot(bx - ax, by - ay);
      carry = 0;
    }
    carry += seg;
  }
  const last = dense[dense.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > 0.5) out.push(last);
  return out;
}
