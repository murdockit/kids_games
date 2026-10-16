// Clothes and accessories for the Hair Salon friends. Everything is drawn on the canvas (not emoji)
// so it is sized and placed to fit each friend: glasses sit on the eyes, hats sit on top of the hair.
// Coordinates match salon.js: a 600×700 scene, head centered at (300, 330), eyes at x 248 / 352, y 320.

const INK = '#2b2d42';
const EYES = [248, 352];
const EYE_Y = 320;

// ---------- Clothes ----------
export const CLOTHES_COLORS = [
  ['red', '#ef4444'], ['orange', '#f97316'], ['yellow', '#facc15'], ['green', '#22c55e'], ['teal', '#14b8a6'],
  ['blue', '#3b82f6'], ['purple', '#a855f7'], ['pink', '#f9a8d4'], ['hot pink', '#ec4899'], ['brown', '#92400e'],
  ['black', '#2b2d42'], ['white', '#f8fafc'],
].map(([name, hex]) => ({ name, hex }));

export const OUTFITS = [
  { id: 'cape', name: 'Salon cape' },
  { id: 'tee', name: 'T-shirt', color: '#3b82f6' },
  { id: 'stripes', name: 'Stripes', color: '#ef4444' },
  { id: 'dots', name: 'Polka dots', color: '#a855f7' },
  { id: 'dress', name: 'Pretty dress', color: '#f9a8d4' },
  { id: 'hoodie', name: 'Hoodie', color: '#22c55e' },
  { id: 'overalls', name: 'Overalls', color: '#3b82f6' },
  { id: 'tux', name: 'Fancy suit', color: '#2b2d42' },
  { id: 'super', name: 'Superhero', color: '#ef4444' },
  { id: 'princess', name: 'Princess gown', color: '#c084fc' },
  { id: 'jersey', name: 'Sports jersey', color: '#f97316' },
  { id: 'rainbow', name: 'Rainbow shirt' },
  { id: 'pjs', name: 'Star pajamas', color: '#1e3a8a' },
  // Bonus outfits, unlocked with stars (js/rewards.js)
  { id: 'fairy', name: 'Fairy dress', color: '#a7f3d0', bonus: true },
  { id: 'astronaut', name: 'Astronaut suit', color: '#e5e7eb', bonus: true },
  { id: 'onesie', name: 'Unicorn onesie', color: '#fbcfe8', bonus: true },
];

function shade(hex, t) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(t < 0 ? v * (1 + t) : v + (255 - v) * t)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function bodyPath(g) {
  g.beginPath();
  g.moveTo(90, 710);
  g.quadraticCurveTo(110, 520, 300, 505);
  g.quadraticCurveTo(490, 520, 510, 710);
  g.closePath();
}

function circle(g, x, y, r, fill, stroke = INK, lw = 4) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

function poly(g, pts, fill, stroke = INK, lw = 4) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (stroke) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}

function star(g, x, y, r, fill, stroke = null) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  poly(g, pts, fill, stroke, 3);
}

// A round neckline showing the neck.
function neckline(g, skin, trim) {
  g.beginPath();
  g.ellipse(300, 508, 44, 20, 0, 0, Math.PI * 2);
  g.fillStyle = skin;
  g.fill();
  g.lineWidth = 8;
  g.strokeStyle = trim;
  g.stroke();
}

function bow(g, x, y, s, color) {
  poly(g, [[x, y], [x - 34 * s, y - 20 * s], [x - 34 * s, y + 20 * s]], color, INK, 3);
  poly(g, [[x, y], [x + 34 * s, y - 20 * s], [x + 34 * s, y + 20 * s]], color, INK, 3);
  circle(g, x, y, 9 * s, shade(color, -0.2), INK, 3);
}

// Draws the clothes (the neck is drawn first by the caller).
export function drawOutfit(g, friend, outfit) {
  const id = outfit?.id || 'cape';
  const c = outfit?.color || OUTFITS.find((o) => o.id === id)?.color || friend.cape;
  const skin = friend.skin;
  g.save();
  g.lineJoin = 'round';

  if (id === 'hoodie') {
    // Hood behind the neck
    g.beginPath();
    g.ellipse(300, 500, 125, 42, 0, 0, Math.PI * 2);
    g.fillStyle = shade(c, -0.25);
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.stroke();
  }
  if (id === 'fairy') {
    // Wings behind the shoulders
    for (const sgn of [-1, 1]) {
      g.beginPath();
      g.ellipse(300 + sgn * 175, 560, 80, 50, sgn * -0.5, 0, Math.PI * 2);
      g.fillStyle = 'rgba(186, 230, 253, 0.85)';
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = INK;
      g.stroke();
    }
  }
  if (id === 'onesie') {
    // Unicorn hood behind the head, with ears and a horn on top
    g.beginPath();
    g.ellipse(300, 330, 160, 185, 0, 0, Math.PI * 2);
    g.fillStyle = c;
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.stroke();
    poly(g, [[285, 150], [300, 60], [315, 150]], '#fcd34d', INK, 5);
    poly(g, [[180, 190], [175, 125], [225, 160]], c, INK, 5);
    poly(g, [[420, 190], [425, 125], [375, 160]], c, INK, 5);
  }
  if (id === 'super') {
    // Cape peeking out at the shoulders
    poly(g, [[120, 560], [50, 710], [150, 710]], shade('#facc15', 0), INK, 4);
    poly(g, [[480, 560], [550, 710], [450, 710]], shade('#facc15', 0), INK, 4);
  }

  // Base shirt/dress color, with a pattern clipped to the body
  bodyPath(g);
  g.fillStyle = id === 'cape' ? friend.cape : id === 'overalls' ? '#fef3c7' : id === 'stripes' ? '#fff' : id === 'rainbow' ? '#ef4444' : c;
  g.fill();
  g.save();
  bodyPath(g);
  g.clip();
  switch (id) {
    case 'cape':
      g.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = 130; x < 480; x += 60) circle(g, x, 600, 10, 'rgba(255,255,255,0.35)', null);
      break;
    case 'stripes':
      g.fillStyle = c;
      for (let y = 520; y < 710; y += 44) g.fillRect(0, y, 600, 22);
      break;
    case 'rainbow': {
      const cols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
      cols.forEach((col, i) => {
        g.fillStyle = col;
        g.fillRect(0, 500 + i * 36, 600, 36);
      });
      break;
    }
    case 'dots':
      for (let y = 545; y < 710; y += 48) {
        for (let x = 100 + ((y / 48) % 2) * 24; x < 520; x += 48) circle(g, x, y, 11, '#fff', null);
      }
      break;
    case 'pjs':
      for (let y = 560; y < 710; y += 60) {
        for (let x = 120 + ((y / 60) % 2) * 40; x < 500; x += 80) star(g, x, y, 14, '#fde047');
      }
      for (let x = 160; x < 480; x += 160) {
        g.beginPath();
        g.arc(x, 620, 14, 0.6, Math.PI * 1.7);
        g.fillStyle = '#fef9c3';
        g.fill();
      }
      break;
    case 'princess': {
      const grad = g.createLinearGradient(0, 505, 0, 700);
      grad.addColorStop(0, shade(c, 0.35));
      grad.addColorStop(1, c);
      g.fillStyle = grad;
      g.fillRect(0, 500, 600, 210);
      for (let i = 0; i < 18; i++) star(g, 120 + ((i * 97) % 360), 560 + ((i * 53) % 140), 7, '#fde68a');
      break;
    }
    case 'tux':
      poly(g, [[250, 505], [350, 505], [300, 700]], '#fff', null);
      g.lineWidth = 5;
      g.strokeStyle = shade(c, 0.25);
      g.beginPath();
      g.moveTo(250, 505);
      g.lineTo(285, 640);
      g.moveTo(350, 505);
      g.lineTo(315, 640);
      g.stroke();
      circle(g, 300, 600, 6, INK, null);
      circle(g, 300, 640, 6, INK, null);
      break;
    case 'overalls':
      g.fillStyle = shade('#3b82f6', -0.15);
      g.fillRect(210, 575, 180, 140);
      g.fillRect(150, 660, 300, 60);
      g.fillStyle = shade('#3b82f6', -0.15);
      poly(g, [[180, 525], [215, 520], [245, 580], [210, 580]], shade('#3b82f6', -0.15), INK, 3);
      poly(g, [[420, 525], [385, 520], [355, 580], [390, 580]], shade('#3b82f6', -0.15), INK, 3);
      g.strokeStyle = INK;
      g.lineWidth = 4;
      g.strokeRect(210, 575, 180, 140);
      g.strokeRect(255, 600, 90, 50);
      circle(g, 228, 592, 8, '#fbbf24', INK, 3);
      circle(g, 372, 592, 8, '#fbbf24', INK, 3);
      break;
    case 'hoodie':
      g.fillStyle = shade(c, -0.15);
      g.beginPath();
      g.roundRect ? g.roundRect(215, 615, 170, 70, 18) : g.rect(215, 615, 170, 70);
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = INK;
      g.stroke();
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(282, 525);
      g.lineTo(278, 585);
      g.moveTo(318, 525);
      g.lineTo(322, 585);
      g.stroke();
      circle(g, 278, 590, 6, '#fff', INK, 3);
      circle(g, 322, 590, 6, '#fff', INK, 3);
      break;
    case 'super':
      circle(g, 300, 615, 58, '#facc15', INK, 5);
      star(g, 300, 618, 44, c, INK);
      g.fillStyle = INK;
      g.fillRect(0, 690, 600, 20);
      break;
    case 'fairy':
      for (let i = 0; i < 22; i++) star(g, 110 + ((i * 89) % 380), 545 + ((i * 47) % 150), 6, '#fde68a');
      break;
    case 'astronaut':
      g.fillStyle = '#cbd5e1';
      g.fillRect(0, 680, 600, 30);
      g.beginPath();
      g.roundRect ? g.roundRect(330, 580, 90, 60, 8) : g.rect(330, 580, 90, 60);
      g.fillStyle = '#94a3b8';
      g.fill();
      g.lineWidth = 4;
      g.strokeStyle = INK;
      g.stroke();
      for (const [x, col] of [[350, '#ef4444'], [375, '#22c55e'], [400, '#3b82f6']]) circle(g, x, 610, 7, col, INK, 2);
      circle(g, 215, 600, 26, '#3b82f6', INK, 4);
      star(g, 215, 601, 15, '#fff');
      break;
    case 'onesie':
      for (let i = 0; i < 12; i++) circle(g, 120 + ((i * 71) % 360), 560 + ((i * 37) % 130), 7, i % 2 ? '#c4b5fd' : '#fff', null);
      break;
    case 'jersey':
      g.fillStyle = '#fff';
      g.fillRect(150, 520, 30, 200);
      g.fillRect(420, 520, 30, 200);
      g.font = 'bold 130px ui-rounded, system-ui, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.lineWidth = 8;
      g.strokeStyle = INK;
      g.strokeText('5', 300, 625);
      g.fillStyle = '#fff';
      g.fillText('5', 300, 625);
      break;
  }
  g.restore();
  bodyPath(g);
  g.lineWidth = 5;
  g.strokeStyle = INK;
  g.stroke();

  // Necklines and collars
  switch (id) {
    case 'cape':
      g.beginPath();
      g.ellipse(300, 512, 52, 14, 0, 0, Math.PI * 2);
      g.fillStyle = '#fff';
      g.fill();
      g.stroke();
      break;
    case 'dress':
      neckline(g, skin, shade(c, -0.2));
      g.save();
      for (const sgn of [-1, 1]) {
        g.beginPath();
        g.ellipse(300 + sgn * 36, 530, 40, 24, sgn * 0.35, 0, Math.PI * 2);
        g.fillStyle = '#fff';
        g.fill();
        g.lineWidth = 4;
        g.strokeStyle = INK;
        g.stroke();
      }
      g.restore();
      bow(g, 300, 540, 0.9, '#ef4444');
      break;
    case 'tux':
      neckline(g, skin, '#fff');
      bow(g, 300, 528, 0.9, '#ef4444');
      break;
    case 'princess':
      neckline(g, skin, shade(c, -0.15));
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (0.15 + (0.7 * i) / 10);
        circle(g, 300 + Math.cos(a) * 52, 512 + Math.sin(a) * 30, 6, '#fff', '#d1d5db', 2);
      }
      poly(g, [[300, 545], [314, 560], [300, 580], [286, 560]], '#ec4899', INK, 3);
      break;
    case 'jersey':
      g.beginPath();
      g.moveTo(256, 508);
      g.lineTo(300, 560);
      g.lineTo(344, 508);
      g.closePath();
      g.fillStyle = skin;
      g.fill();
      g.lineWidth = 9;
      g.strokeStyle = '#fff';
      g.stroke();
      break;
    case 'overalls':
      neckline(g, skin, '#fde68a');
      break;
    default:
      neckline(g, skin, id === 'rainbow' ? '#a855f7' : shade(c, -0.2));
  }
  g.restore();
}

// ---------- Hats and glasses ----------
// Where the top of the hair is, so hats sit on the hair (Bella's afro is much taller than Grandpa Bob's head).
export function hairTop(strands) {
  const ys = [];
  for (const s of strands) for (const q of s.pts) if (Math.abs(q.x - 300) < 70) ys.push(q.y);
  if (!ys.length) return 180;
  ys.sort((a, b) => a - b);
  const top = ys[Math.min(ys.length - 1, 4)];
  return Math.max(45, Math.min(180, top));
}

// y is where the hat touches the head/hair.
const HATS = {
  crown(g, y) {
    poly(g, [[205, y + 12], [195, y - 70], [240, y - 30], [270, y - 90], [300, y - 40], [330, y - 90], [360, y - 30], [405, y - 70], [395, y + 12]], '#facc15', INK, 5);
    g.fillStyle = '#eab308';
    g.fillRect(203, y - 6, 194, 18);
    g.strokeRect(203, y - 6, 194, 18);
    circle(g, 300, y + 3, 9, '#ef4444', INK, 3);
    circle(g, 250, y + 3, 7, '#3b82f6', INK, 3);
    circle(g, 350, y + 3, 7, '#22c55e', INK, 3);
    for (const [x, yy] of [[195, y - 70], [270, y - 90], [330, y - 90], [405, y - 70]]) circle(g, x, yy, 8, '#fde68a', INK, 3);
  },
  tiara(g, y) {
    g.lineWidth = 7;
    g.strokeStyle = '#cbd5e1';
    g.beginPath();
    g.ellipse(300, y + 40, 115, 45, 0, Math.PI * 1.1, Math.PI * 1.9);
    g.stroke();
    poly(g, [[262, y + 2], [280, y - 30], [300, y - 55], [320, y - 30], [338, y + 2]], '#e2e8f0', INK, 4);
    poly(g, [[300, y - 35], [312, y - 18], [300, y], [288, y - 18]], '#ec4899', INK, 3);
    for (const x of [235, 365]) circle(g, x, y + 4, 7, '#a5f3fc', INK, 3);
  },
  tophat(g, y) {
    g.beginPath();
    g.ellipse(300, y + 4, 125, 20, 0, 0, Math.PI * 2);
    g.fillStyle = '#1f2937';
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.stroke();
    g.fillStyle = '#1f2937';
    g.fillRect(230, y - 125, 140, 128);
    g.strokeRect(230, y - 125, 140, 128);
    g.fillStyle = '#ef4444';
    g.fillRect(230, y - 30, 140, 22);
    g.strokeRect(230, y - 30, 140, 22);
  },
  cap(g, y) {
    g.beginPath();
    g.ellipse(300, y + 22, 165, 26, 0, 0, Math.PI * 2);
    g.fillStyle = '#b91c1c';
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.stroke();
    g.beginPath();
    g.ellipse(300, y + 10, 128, 80, 0, Math.PI, Math.PI * 2);
    g.closePath();
    g.fillStyle = '#ef4444';
    g.fill();
    g.stroke();
    circle(g, 300, y - 70, 9, '#ef4444', INK, 4);
    g.font = 'bold 50px ui-rounded, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#fff';
    g.fillText('L', 300, y - 22);
  },
  party(g, y) {
    poly(g, [[245, y + 10], [300, y - 140], [355, y + 10]], '#a855f7', INK, 5);
    g.save();
    g.beginPath();
    g.moveTo(245, y + 10);
    g.lineTo(300, y - 140);
    g.lineTo(355, y + 10);
    g.closePath();
    g.clip();
    for (let k = 0; k < 4; k++) {
      g.fillStyle = k % 2 ? '#facc15' : '#22d3ee';
      g.fillRect(200, y - 110 + k * 32, 200, 14);
    }
    g.restore();
    circle(g, 300, y - 145, 16, '#f472b6', INK, 4);
  },
  flowers(g, y) {
    const cols = ['#f472b6', '#facc15', '#a78bfa', '#fb923c', '#f472b6', '#38bdf8', '#facc15'];
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (1.15 + (0.7 * i) / 6);
      const x = 300 + Math.cos(a) * 125;
      const yy = y + 75 + Math.sin(a) * 80;
      for (let k = 0; k < 5; k++) {
        const pa = (k / 5) * Math.PI * 2;
        circle(g, x + Math.cos(pa) * 12, yy + Math.sin(pa) * 12, 10, cols[i], INK, 2.5);
      }
      circle(g, x, yy, 8, '#fde047', INK, 2.5);
    }
  },
  bow(g, y) {
    bow(g, 375, y + 30, 1.8, '#ec4899');
  },
  wizard(g, y) {
    g.beginPath();
    g.ellipse(300, y + 6, 130, 22, 0, 0, Math.PI * 2);
    g.fillStyle = '#6d28d9';
    g.fill();
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.stroke();
    poly(g, [[230, y + 2], [320, y - 170], [370, y + 2]], '#7c3aed', INK, 5);
    star(g, 290, y - 50, 14, '#fde047');
    star(g, 325, y - 100, 10, '#fde047');
    circle(g, 270, y - 20, 5, '#fde047', null);
  },
  chef(g, y) {
    g.fillStyle = '#fff';
    g.fillRect(225, y - 40, 150, 48);
    g.lineWidth = 5;
    g.strokeStyle = INK;
    g.strokeRect(225, y - 40, 150, 48);
    for (const [x, yy, r] of [[245, -70, 38], [300, -95, 46], [355, -70, 38]]) circle(g, x, y + yy, r, '#fff', INK, 5);
    g.fillStyle = '#fff';
    g.fillRect(229, y - 62, 142, 26);
  },
  bunny(g, y) {
    for (const sgn of [-1, 1]) {
      g.save();
      g.translate(300 + sgn * 55, y - 60);
      g.rotate(sgn * 0.2);
      g.beginPath();
      g.ellipse(0, 0, 28, 80, 0, 0, Math.PI * 2);
      g.fillStyle = '#fff';
      g.fill();
      g.lineWidth = 5;
      g.strokeStyle = INK;
      g.stroke();
      g.beginPath();
      g.ellipse(0, 6, 13, 56, 0, 0, Math.PI * 2);
      g.fillStyle = '#fbcfe8';
      g.fill();
      g.restore();
    }
    g.lineWidth = 12;
    g.strokeStyle = '#f472b6';
    g.beginPath();
    g.ellipse(300, y + 45, 120, 55, 0, Math.PI * 1.08, Math.PI * 1.92);
    g.stroke();
  },
};

function lensPath(g, shape, x, y, w, h) {
  g.beginPath();
  if (shape === 'heart') {
    g.moveTo(x, y + h * 0.5);
    g.bezierCurveTo(x - w * 0.7, y, x - w * 0.6, y - h * 0.65, x, y - h * 0.25);
    g.bezierCurveTo(x + w * 0.6, y - h * 0.65, x + w * 0.7, y, x, y + h * 0.5);
  } else if (shape === 'star') {
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? w * 0.27 : w * 0.6;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath();
  } else if (shape === 'round') {
    g.ellipse(x, y, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (g.roundRect) {
    g.roundRect(x - w / 2, y - h / 2, w, h, 18);
  } else {
    g.rect(x - w / 2, y - h / 2, w, h);
  }
}

function glasses(g, friend, shape, frame, tint) {
  const big = friend.kind === 'monster' ? 1.15 : 1;
  const w = 82 * big;
  const h = (shape === 'round' ? 72 : 58) * big;
  // Arms to the side of the head
  g.lineWidth = 6;
  g.strokeStyle = frame;
  g.beginPath();
  g.moveTo(EYES[0] - w / 2, EYE_Y - 6);
  g.lineTo(172, EYE_Y - 14);
  g.moveTo(EYES[1] + w / 2, EYE_Y - 6);
  g.lineTo(428, EYE_Y - 14);
  g.stroke();
  // Bridge
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(EYES[0] + w / 2 - 4, EYE_Y - 8);
  g.quadraticCurveTo(300, EYE_Y - 22, EYES[1] - w / 2 + 4, EYE_Y - 8);
  g.stroke();
  for (const x of EYES) {
    lensPath(g, shape, x, EYE_Y, w, h);
    if (tint) {
      g.fillStyle = tint;
      g.fill();
    }
    g.lineWidth = 7;
    g.strokeStyle = frame;
    g.stroke();
    // shine
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(x - w * 0.22, EYE_Y - h * 0.18);
    g.lineTo(x - w * 0.08, EYE_Y - h * 0.3);
    g.stroke();
  }
}

const GLASSES = {
  sunglasses: (g, f) => glasses(g, f, 'rect', INK, 'rgba(17,24,39,0.88)'),
  hearts: (g, f) => glasses(g, f, 'heart', '#db2777', 'rgba(244,114,182,0.55)'),
  round: (g, f) => glasses(g, f, 'round', '#92400e', 'rgba(255,255,255,0.15)'),
  stars: (g, f) => glasses(g, f, 'star', '#ca8a04', 'rgba(250,204,21,0.45)'),
  rainbow: (g, f) => {
    const grad = g.createLinearGradient(160, 0, 440, 0);
    ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7'].forEach((c, i) => grad.addColorStop(i / 5, c));
    glasses(g, f, 'round', grad, 'rgba(255,255,255,0.2)');
  },
};

export const WEARABLES = [
  { id: 'crown', slot: 'head', name: 'Crown' },
  { id: 'tiara', slot: 'head', name: 'Tiara' },
  { id: 'tophat', slot: 'head', name: 'Top hat' },
  { id: 'cap', slot: 'head', name: 'Baseball cap' },
  { id: 'party', slot: 'head', name: 'Party hat' },
  { id: 'flowers', slot: 'head', name: 'Flower crown' },
  { id: 'bow', slot: 'head', name: 'Big bow' },
  { id: 'bunny', slot: 'head', name: 'Bunny ears' },
  { id: 'sunglasses', slot: 'eyes', name: 'Sunglasses' },
  { id: 'hearts', slot: 'eyes', name: 'Heart glasses' },
  { id: 'round', slot: 'eyes', name: 'Round glasses' },
  { id: 'stars', slot: 'eyes', name: 'Star glasses' },
  // Bonus items, unlocked with stars (js/rewards.js)
  { id: 'wizard', slot: 'head', name: 'Wizard hat', bonus: true },
  { id: 'chef', slot: 'head', name: 'Chef hat', bonus: true },
  { id: 'rainbow', slot: 'eyes', name: 'Rainbow glasses', bonus: true },
];

export function drawGlasses(g, friend, wear) {
  if (wear?.eyes && GLASSES[wear.eyes]) GLASSES[wear.eyes](g, friend);
}

export function drawHat(g, wear, y) {
  if (wear?.head && HATS[wear.head]) HATS[wear.head](g, y);
}

// Small picture of an item for the tray: draws it around its anchor, scaled to fit.
export function wearablePreview(item, friend, size = 120) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  if (item.slot === 'eyes') {
    g.translate(size / 2, size / 2);
    g.scale(size / 300, size / 300);
    g.translate(-300, -EYE_Y);
    GLASSES[item.id](g, friend);
  } else {
    g.translate(size / 2, size * 0.68);
    g.scale(size / 330, size / 330);
    g.translate(item.id === 'bow' ? -375 : -300, -60);
    HATS[item.id](g, 60);
  }
  return c.toDataURL();
}

export function outfitPreview(outfit, friend, color, size = 120) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  // Show the shoulders area (x 70–530, y 440–700), centered in the tile.
  g.scale(size / 460, size / 460);
  g.translate(-70, -340);
  g.fillStyle = friend.skin;
  g.fillRect(262, 440, 76, 75);
  drawOutfit(g, friend, { id: outfit.id, color });
  return c.toDataURL();
}
