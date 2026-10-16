// Dot-to-dot: tap the numbers in order to draw a mystery picture, then it fills with color.
import { say, sfx, cheer, doneScreen, el, sample, wiggle } from '../common.js';
import { logRound } from '../activity.js';

const star = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  const r = i % 2 ? 19 : 44;
  return [50 + Math.cos(a) * r, 54 + Math.sin(a) * r];
});
const heart = Array.from({ length: 12 }, (_, i) => {
  const t = Math.PI + (i / 12) * Math.PI * 2; // start at the dip in the top middle
  const x = 16 * Math.sin(t) ** 3;
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [50 + x * 2.6, 48 - y * 2.6];
});

// Points in a 100 × 100 box, in the order she taps them.
const PICTURES = [
  { name: 'a star', emoji: '⭐', color: '#facc15', pts: star },
  { name: 'a heart', emoji: '💖', color: '#f472b6', pts: heart },
  { name: 'a house', emoji: '🏠', color: '#fb923c', pts: [[20, 90], [20, 50], [50, 22], [64, 36], [64, 24], [72, 24], [72, 44], [80, 52], [80, 90]] },
  { name: 'a fish', emoji: '🐟', color: '#38bdf8', pts: [[12, 50], [32, 32], [58, 28], [76, 42], [92, 28], [92, 72], [76, 58], [58, 72], [32, 68]] },
  { name: 'a tree', emoji: '🌲', color: '#22c55e', pts: [[50, 8], [68, 32], [60, 32], [76, 54], [64, 54], [82, 76], [56, 76], [56, 92], [44, 92], [44, 76], [18, 76], [36, 54], [24, 54], [40, 32], [32, 32]] },
  { name: 'a rocket', emoji: '🚀', color: '#a78bfa', pts: [[50, 6], [64, 28], [64, 64], [78, 84], [60, 78], [40, 78], [22, 84], [36, 64], [36, 28]] },
  { name: 'a kitty', emoji: '🐱', color: '#fbbf24', pts: [[22, 86], [16, 46], [26, 12], [42, 34], [58, 34], [74, 12], [84, 46], [78, 86]] },
  { name: 'a sailboat', emoji: '⛵', color: '#60a5fa', pts: [[52, 8], [80, 60], [92, 62], [76, 86], [24, 86], [8, 62], [48, 60]] },
];

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

export function dotToDot({ main, bar, exit }) {
  const list = sample(PICTURES, 3);
  let n = 0;
  next();

  function next() {
    if (n >= list.length) {
      logRound('play');
      bar.onRepeat(null);
      doneScreen(main, { onAgain: () => dotToDot({ main, bar, exit }), onBack: exit, message: 'You found all the pictures!' });
      return;
    }
    draw(list[n]);
  }

  function draw(pic) {
    main.innerHTML = '';
    const svg = svgEl('svg', { viewBox: '-4 -4 108 108', class: 'dots-board' });
    const fill = svgEl('polygon', { points: pic.pts.map((p) => p.join(',')).join(' '), fill: pic.color, opacity: 0, class: 'dots-fill' });
    const line = svgEl('polyline', { points: '', fill: 'none', stroke: '#2b2d42', 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    svg.append(fill, line);
    let at = 0;
    const dots = pic.pts.map(([x, y], i) => {
      const g = svgEl('g', { class: 'dot', 'aria-label': `dot ${i + 1}`, role: 'button' });
      const hit = svgEl('circle', { cx: x, cy: y, r: 6.5, fill: 'transparent' });
      const c = svgEl('circle', { cx: x, cy: y, r: 2.6, class: 'dot-c' });
      // Numbers sit outside the picture so the lines don't cover them.
      const dx = x - 50, dy = y - 52, d = Math.hypot(dx, dy) || 1;
      const label = svgEl('text', { x: x + (dx / d) * 6, y: y + (dy / d) * 6 + 1.6, class: 'dot-n' });
      label.textContent = String(i + 1);
      g.append(hit, c, label);
      g.addEventListener('pointerdown', () => tap(i, g));
      svg.appendChild(g);
      return g;
    });
    const shown = el('div', 'dots-reveal');
    main.append(el('p', 'prompt-text', 'Connect the dots! 1, 2, 3…'), svg, shown);
    dots[0].classList.add('next');
    const prompt = 'Tap the dots in order. Start at one!';
    bar.onRepeat(() => say(prompt));
    say(prompt);
    window.__dots = { count: pic.pts.length };

    async function tap(i, g) {
      if (i !== at) {
        if (i > at) {
          sfx('oops');
          wiggle(dots[at]);
          say(`Find ${at + 1}!`);
        }
        return;
      }
      sfx('pop');
      g.classList.remove('next');
      g.classList.add('done');
      at++;
      line.setAttribute('points', pic.pts.slice(0, at).map((p) => p.join(',')).join(' '));
      say(String(at));
      if (at < pic.pts.length) {
        dots[at].classList.add('next');
        return;
      }
      // Close the shape and color it in.
      line.setAttribute('points', [...pic.pts, pic.pts[0]].map((p) => p.join(',')).join(' '));
      fill.setAttribute('opacity', 1);
      shown.textContent = pic.emoji;
      shown.classList.add('show');
      await cheer(`It's ${pic.name}!`);
      n++;
      next();
    }
  }
}
