// Sparkle the unicorn: the friendly guide on the home screen and in celebrations.
// Drawn as SVG with separate parts (head, tail, eyes, sparkles) that CSS animates.
import { say, sfx, pick, KID } from './common.js';

const INK = '#2b2d42';

export function unicornSVG() {
  return `
<svg class="unicorn" viewBox="0 0 220 210" aria-hidden="true">
  <g class="u-tail" stroke="${INK}" stroke-width="4">
    <path d="M52 128 C20 120 14 150 30 168 C18 170 20 190 40 186 C50 176 62 150 58 132 Z" fill="#c4b5fd"/>
    <path d="M50 134 C30 132 28 152 38 162 C44 156 54 146 52 136 Z" fill="#f9a8d4"/>
  </g>
  <g class="u-body" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <rect x="68" y="150" width="20" height="42" rx="9" fill="#fff"/>
    <rect x="128" y="150" width="20" height="42" rx="9" fill="#fff"/>
    <rect x="66" y="182" width="24" height="14" rx="6" fill="#c4b5fd"/>
    <rect x="126" y="182" width="24" height="14" rx="6" fill="#c4b5fd"/>
    <ellipse cx="106" cy="140" rx="62" ry="38" fill="#fff"/>
    <rect x="90" y="150" width="18" height="38" rx="8" fill="#f8fafc"/>
    <rect x="146" y="148" width="18" height="40" rx="8" fill="#f8fafc"/>
    <rect x="88" y="180" width="22" height="13" rx="6" fill="#c4b5fd"/>
    <rect x="144" y="180" width="22" height="13" rx="6" fill="#c4b5fd"/>
    <ellipse cx="96" cy="132" rx="12" ry="8" fill="#fbcfe8" stroke="none" opacity=".7"/>
  </g>
  <g class="u-head" stroke="${INK}" stroke-width="4" stroke-linejoin="round">
    <path d="M118 120 C112 100 118 82 132 76 L160 112 Z" fill="#fff"/>
    <g class="u-mane">
      <circle cx="112" cy="58" r="16" fill="#f9a8d4"/>
      <circle cx="104" cy="78" r="15" fill="#c4b5fd"/>
      <circle cx="104" cy="98" r="14" fill="#93c5fd"/>
      <circle cx="110" cy="116" r="12" fill="#fde68a"/>
    </g>
    <polygon points="126,50 132,22 146,46" fill="#fff"/>
    <polygon points="130,46 133,32 140,44" fill="#fbcfe8" stroke="none"/>
    <ellipse cx="148" cy="78" rx="36" ry="32" fill="#fff"/>
    <g class="u-horn">
      <polygon points="150,48 168,4 172,50" fill="#fcd34d"/>
      <path d="M155 38 L170 32 M158 28 L169 22 M161 18 L168 14" fill="none" stroke="#f59e0b" stroke-width="3"/>
    </g>
    <circle cx="124" cy="56" r="13" fill="#f9a8d4"/>
    <ellipse cx="170" cy="96" rx="26" ry="18" fill="#fde2f3"/>
    <ellipse cx="165" cy="94" rx="3" ry="4" fill="${INK}" stroke="none"/>
    <ellipse cx="180" cy="94" rx="3" ry="4" fill="${INK}" stroke="none"/>
    <path d="M160 104 Q170 112 182 104" fill="none" stroke-width="3.5"/>
    <g class="u-eye">
      <ellipse cx="146" cy="74" rx="8" ry="11" fill="${INK}" stroke="none"/>
      <circle cx="149" cy="69" r="3.2" fill="#fff" stroke="none"/>
      <circle cx="143" cy="78" r="1.6" fill="#fff" stroke="none"/>
    </g>
    <path d="M137 62 q6 -6 14 -4" fill="none" stroke-width="3"/>
    <ellipse cx="136" cy="92" rx="9" ry="6" fill="#f9a8d4" stroke="none" opacity=".75"/>
  </g>
  <g class="u-sparkles" fill="#fde047" stroke="none">
    <path class="s1" d="M190 20 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/>
    <path class="s2" d="M196 56 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z"/>
    <path class="s3" d="M182 -2 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" transform="translate(-40 14)"/>
  </g>
</svg>`;
}

// Built on demand: this file and common.js import each other, so KID isn't ready at load time.
const hellos = () => [
  `Hi ${KID}! What do you want to play?`,
  `Hello ${KID}! I'm Sparkle the unicorn!`,
  `Yay, you're here, ${KID}!`,
  'Pick a game, and let’s have fun!',
  'Neigh! That tickles!',
];

// Puts Sparkle into `container`. Tapping her makes her jump and say hello.
export function mountMascot(container, { size = 150, talk = true } = {}) {
  const wrap = document.createElement('button');
  wrap.className = 'mascot';
  wrap.setAttribute('aria-label', 'Sparkle the unicorn');
  wrap.style.width = `${size}px`;
  wrap.innerHTML = unicornSVG();
  wrap.addEventListener('click', () => {
    sfx('boing');
    jump(wrap);
    if (talk) say(pick(hellos()));
  });
  container.appendChild(wrap);
  return wrap;
}

export function jump(el) {
  el.classList.remove('jump');
  void el.offsetWidth;
  el.classList.add('jump');
}
