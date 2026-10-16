// Home screen: Sparkle the unicorn, the star counter, and the game tiles.
import { topBar, KID, say, sfx, go } from './common.js';
import { getProfiles, currentProfile, setCurrentProfile } from './storage.js';
import { mountMascot } from './mascot.js';

const bar = topBar({ title: `${KID}'s Games`, home: 'index.html' });
document.querySelector('.home-hero .speech').textContent = `Hi ${KID}! Pick a game!`;
// Nothing to go back to from home.
document.querySelector('[data-back]').classList.add('hidden');
bar.onBack(() => {});

const spot = document.querySelector('[data-mascot]');
const sparkle = mountMascot(spot, { size: 170 });
spot.replaceWith(sparkle);

// More than one player: "Who's playing?" chips above the games.
const players = getProfiles();
if (players.length > 1) {
  const row = document.querySelector('[data-players]');
  row.hidden = false;
  const me = currentProfile().id;
  for (const p of players) {
    const b = document.createElement('button');
    b.className = `player-chip${p.id === me ? ' on' : ''}`;
    b.innerHTML = '<span></span>';
    b.firstChild.textContent = p.avatar;
    b.append(p.name);
    b.setAttribute('aria-label', p.name);
    b.addEventListener('click', () => {
      if (p.id === me) return say(`Hi ${p.name}!`);
      sfx('boing');
      setCurrentProfile(p.id);
      go(location.href);
    });
    row.appendChild(b);
  }
}
