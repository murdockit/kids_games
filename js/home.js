// Home screen: the star counter, and the game tiles.
import { topBar } from './common.js';

const bar = topBar({ title: "Lydia's Games", home: 'index.html' });
// Nothing to go back to from home.
document.querySelector('[data-back]').classList.add('hidden');
bar.onBack(() => {});
