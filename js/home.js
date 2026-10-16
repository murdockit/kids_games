// Home screen: Sparkle the unicorn, the star counter, and the game tiles.
import { topBar } from './common.js';
import { mountMascot } from './mascot.js';

const bar = topBar({ title: "Lydia's Games", home: 'index.html' });
// Nothing to go back to from home.
document.querySelector('[data-back]').classList.add('hidden');
bar.onBack(() => {});

const spot = document.querySelector('[data-mascot]');
const sparkle = mountMascot(spot, { size: 170 });
spot.replaceWith(sparkle);
