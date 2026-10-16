// Mazes: drag Sparkle through the maze to the treat. Each maze is a little bigger.
import { say, sfx, cheer, doneScreen, el, pick, shuffle } from '../common.js';
import { logRound } from '../activity.js';

const LEVELS = [
  [4, 5],
  [5, 7],
  [6, 8],
];
const GOALS = [['🌈', 'the rainbow'], ['🍓', 'the strawberry'], ['🏰', 'the castle'], ['🧁', 'the cupcake'], ['🌟', 'the star']];

// A random "perfect" maze (one path between any two spots), made by wandering and backing up.
function makeMaze(cols, rows) {
  const open = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ n: false, e: false, s: false, w: false })));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [[0, 0]];
  seen[0][0] = true;
  const dirs = { n: [0, -1, 's'], e: [1, 0, 'w'], s: [0, 1, 'n'], w: [-1, 0, 'e'] };
  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const next = shuffle(Object.entries(dirs)).find(([, [dc, dr]]) => {
      const c2 = c + dc, r2 = r + dr;
      return c2 >= 0 && r2 >= 0 && c2 < cols && r2 < rows && !seen[r2][c2];
    });
    if (!next) {
      stack.pop();
      continue;
    }
    const [d, [dc, dr, back]] = next;
    open[r][c][d] = true;
    open[r + dr][c + dc][back] = true;
    seen[r + dr][c + dc] = true;
    stack.push([c + dc, r + dr]);
  }
  return open;
}

// Shortest path between two cells through open walls.
function path(open, from, to) {
  const key = ([c, r]) => `${c},${r}`;
  const prev = new Map([[key(from), null]]);
  const q = [from];
  const dirs = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
  while (q.length) {
    const cur = q.shift();
    if (key(cur) === key(to)) break;
    for (const [d, [dc, dr]] of Object.entries(dirs)) {
      if (!open[cur[1]][cur[0]][d]) continue;
      const nb = [cur[0] + dc, cur[1] + dr];
      if (prev.has(key(nb))) continue;
      prev.set(key(nb), cur);
      q.push(nb);
    }
  }
  const out = [];
  for (let c = to; c; c = prev.get(key(c))) out.unshift(c);
  return out;
}

export function mazes({ main, bar, exit }) {
  let level = 0;
  next();

  function next() {
    if (level >= LEVELS.length) {
      logRound('play');
      bar.onRepeat(null);
      doneScreen(main, { onAgain: () => mazes({ main, bar, exit }), onBack: exit, message: 'Maze master!' });
      return;
    }
    run(...LEVELS[level]);
  }

  function run(cols, rows) {
    const open = makeMaze(cols, rows);
    const [goalEmoji, goalName] = pick(GOALS);
    const goal = [cols - 1, rows - 1];
    let pos = [0, 0];
    const trail = [[0, 0]];
    let won = false;

    main.innerHTML = '';
    const wrap = el('div', 'maze-wrap');
    const canvas = el('canvas');
    wrap.appendChild(canvas);
    main.append(wrap);
    const availH = innerHeight - 170;
    const cell = Math.floor(Math.min((main.clientWidth - 24) / cols, availH / rows, 130));
    const W = cell * cols, H = cell * rows;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const g = canvas.getContext('2d');

    const prompt = `Help Sparkle get to ${goalName}! Drag her with your finger.`;
    bar.onRepeat(() => say(prompt));
    say(prompt);

    function draw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fffaf0';
      g.fillRect(0, 0, W, H);
      // Rainbow trail
      g.lineCap = g.lineJoin = 'round';
      g.lineWidth = cell * 0.22;
      for (let i = 1; i < trail.length; i++) {
        g.strokeStyle = `hsl(${(i * 25) % 360} 85% 70%)`;
        g.beginPath();
        g.moveTo((trail[i - 1][0] + 0.5) * cell, (trail[i - 1][1] + 0.5) * cell);
        g.lineTo((trail[i][0] + 0.5) * cell, (trail[i][1] + 0.5) * cell);
        g.stroke();
      }
      // Walls
      g.strokeStyle = '#7c3aed';
      g.lineWidth = Math.max(5, cell * 0.08);
      g.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cell, y = r * cell, o = open[r][c];
          if (!o.n) { g.moveTo(x, y); g.lineTo(x + cell, y); }
          if (!o.w) { g.moveTo(x, y); g.lineTo(x, y + cell); }
          if (r === rows - 1 && !o.s) { g.moveTo(x, y + cell); g.lineTo(x + cell, y + cell); }
          if (c === cols - 1 && !o.e) { g.moveTo(x + cell, y); g.lineTo(x + cell, y + cell); }
        }
      }
      g.stroke();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `${cell * 0.62}px sans-serif`;
      g.fillText(goalEmoji, (goal[0] + 0.5) * cell, (goal[1] + 0.52) * cell);
      g.fillText('🦄', (pos[0] + 0.5) * cell, (pos[1] + 0.52) * cell);
    }
    draw();

    const cellAt = (e) => {
      const r = canvas.getBoundingClientRect();
      return [Math.floor((e.clientX - r.left) / cell), Math.floor((e.clientY - r.top) / cell)];
    };
    let dragging = false;
    let bumped = 0;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture?.(e.pointerId);
      dragging = true;
      follow(e);
    });
    canvas.addEventListener('pointermove', (e) => dragging && follow(e));
    const stop = () => (dragging = false);
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);

    // Move toward her finger along the open path (a few cells at a time, so walls still count).
    function follow(e) {
      if (won) return;
      const [c, r] = cellAt(e);
      if (c < 0 || r < 0 || c >= cols || r >= rows || (c === pos[0] && r === pos[1])) return;
      const p = path(open, pos, [c, r]);
      if (p.length < 2 || p.length > 3) {
        // A wall is in the way.
        if (performance.now() - bumped > 700) {
          bumped = performance.now();
          sfx('boing');
        }
        return;
      }
      for (const step of p.slice(1)) {
        pos = step;
        // Going back over her trail rolls it up.
        const back = trail.findIndex((t) => t[0] === step[0] && t[1] === step[1]);
        if (back >= 0) trail.length = back + 1;
        else trail.push(step);
      }
      sfx('bubble');
      draw();
      if (pos[0] === goal[0] && pos[1] === goal[1]) win();
    }

    async function win() {
      won = true;
      dragging = false;
      await cheer(`You made it to ${goalName}!`, { big: true });
      level++;
      next();
    }

    // For tests: the solution as screen points.
    window.__maze = {
      solution: () => {
        const r = canvas.getBoundingClientRect();
        return path(open, pos, goal).map(([c, rr]) => [r.left + (c + 0.5) * cell, r.top + (rr + 0.5) * cell]);
      },
      wallTest: () => {
        // A neighbor cell that is blocked by a wall, if any.
        const r = canvas.getBoundingClientRect();
        const o = open[pos[1]][pos[0]];
        if (!o.e && pos[0] + 1 < cols) return [r.left + (pos[0] + 1.5) * cell, r.top + (pos[1] + 0.5) * cell];
        if (!o.s && pos[1] + 1 < rows) return [r.left + (pos[0] + 0.5) * cell, r.top + (pos[1] + 1.5) * cell];
        return null;
      },
      pos: () => pos,
    };
  }
}
