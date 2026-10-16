// Grown-ups screen: players, progress, heart words, play time, backup, voice, microphone and settings.
import {
  topBar,
  randInt,
  getSettings,
  setSettings,
  resetStars,
  el,
  say,
  KID,
  listVoices,
  setVoice,
  currentVoiceURI,
  voicesReady,
} from './common.js';
import {
  getWords,
  getRemovedStarterWords,
  addWords,
  removeWord,
  setLearned,
  isLearned,
  getStats,
  resetStats,
  exportData,
  importData,
} from './words-store.js';
import { countPictures, deleteAllPictures } from './gallery-store.js';
import { lastDays, totals, accuracy, topMixups, clearActivity, GAME_NAMES } from './activity.js';
import { starsEver, unlockedStickers, unlockedBonuses, COLLECTIBLES, BONUSES } from './rewards.js';
import { musicOn, setMusicOn } from './music.js';
import { getProfiles, currentProfile, setCurrentProfile, addProfile, updateProfile, removeProfile } from './storage.js';
import { getLimits, setLimits, playToday } from './limits.js';
import { syncNow, syncStatus } from './sync.js';

const main = document.getElementById('app');
main.style.justifyContent = 'flex-start';
topBar({ title: 'Grown-ups', home: 'index.html' });

// A question a kindergartner can't answer yet. Keeps little hands out; not real security.
function gate() {
  const a = randInt(6, 9);
  const b = randInt(6, 9);
  main.innerHTML = `
    <form class="panel gate">
      <h2>Grown-ups only</h2>
      <p>Answer to continue:</p>
      <div class="q">${a} × ${b} = ?</div>
      <div class="row" style="justify-content:center">
        <input type="number" inputmode="numeric" autocomplete="off" aria-label="Answer" style="max-width:200px;flex:none">
        <button class="btn" type="submit">Go</button>
      </div>
      <p class="msg" style="color:#b42318"></p>
    </form>`;
  const form = main.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (Number(form.querySelector('input').value) === a * b) {
      try {
        sessionStorage.setItem('lg.grownup', '1');
      } catch {
        /* fine: they'll be asked again next time */
      }
      manage();
    } else {
      form.querySelector('.msg').textContent = 'Not quite — try again.';
      form.querySelector('input').value = '';
    }
  });
}

async function manage() {
  main.innerHTML = '';

  // ---- Add words ----
  const addPanel = el('section', 'panel');
  addPanel.innerHTML = `
    <h2>❤️ Heart words</h2>
    <p>Add words ${KID} is learning. Separate several with commas.</p>
    <form class="row">
      <input type="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="e.g. was, have, they" aria-label="New heart words">
      <button class="btn" type="submit">Add</button>
    </form>
    <p class="msg"></p>
    <ul class="words"></ul>`;
  const msg = addPanel.querySelector('.msg');
  addPanel.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = addPanel.querySelector('input');
    const added = await addWords(input.value);
    input.value = '';
    msg.textContent = added.length ? `Added: ${added.join(', ')}` : '';
    renderList();
  });

  // ---- Removed starter words (restore) ----
  const removedPanel = el('section', 'panel');

  // ---- Backup ----
  const backupPanel = el('section', 'panel');
  backupPanel.innerHTML = `
    <h2>📤 Export heart words</h2>
    <p>Save this player's word list as a file, or load one. The exported file can also replace
       <code>data/heart-words.json</code> on the computer running the games.</p>
    <div class="row">
      <button class="btn" data-export>Export words</button>
      <label class="btn light" style="cursor:pointer">Import words…
        <input type="file" accept=".json,application/json" hidden>
      </label>
    </div>
    <p class="msg"></p>`;
  const backupMsg = backupPanel.querySelector('.msg');
  backupPanel.querySelector('[data-export]').addEventListener('click', async () => {
    const blob = new Blob([JSON.stringify(await exportData(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `heart-words-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    backupMsg.style.color = '';
    backupMsg.textContent = 'Exported.';
  });
  backupPanel.querySelector('input[type=file]').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importData(JSON.parse(await file.text()));
      backupMsg.style.color = '';
      backupMsg.textContent = `Imported ${n} words.`;
      renderList();
    } catch (err) {
      backupMsg.style.color = '#b42318';
      backupMsg.textContent = `Couldn't import that file: ${err.message}`;
    }
  });

  // ---- Settings ----
  const settingsPanel = el('section', 'panel');
  const s = getSettings();
  settingsPanel.innerHTML = `
    <h2>⚙️ Settings</h2>
    <div class="row" style="flex-direction:column;align-items:flex-start;gap:14px">
      <label><input type="checkbox" data-set="speech" ${s.speech ? 'checked' : ''}> Spoken words and instructions</label>
      <label><input type="checkbox" data-set="sounds" ${s.sounds ? 'checked' : ''}> Sound effects</label>
      <label><input type="checkbox" data-music ${musicOn() ? 'checked' : ''}> Background music</label>
      <div class="row">
        <button class="btn danger" data-reset-stars>Reset stars</button>
        <button class="btn danger" data-reset-stats>Reset heart word scores</button>
      </div>
    </div>
    <p class="msg"></p>`;
  const settingsMsg = settingsPanel.querySelector('.msg');
  settingsPanel.querySelector('[data-music]').addEventListener('change', (e) => setMusicOn(e.target.checked));
  settingsPanel.querySelectorAll('[data-set]').forEach((box) =>
    box.addEventListener('change', () => setSettings({ [box.dataset.set]: box.checked })),
  );
  settingsPanel.querySelector('[data-reset-stars]').addEventListener('click', () => {
    if (!confirm(`Reset ${KID}’s stars to 0?`)) return;
    resetStars();
    settingsMsg.textContent = 'Stars reset.';
  });
  settingsPanel.querySelector('[data-reset-stats]').addEventListener('click', () => {
    if (!confirm('Reset the right/wrong scores for every heart word?')) return;
    resetStats();
    renderList();
    settingsMsg.textContent = 'Scores reset.';
  });

  // ---- Voice ----
  const voicePanel = el('section', 'panel');
  voicePanel.innerHTML = `
    <h2>🗣️ Voice</h2>
    <p>The <b>natural voices</b> come from the computer running the games, so they sound the same on
       every device. If that computer's voice service isn't running, the iPad's own voices are used
       instead (Safari can't use voices downloaded in iPad Settings).</p>
    <p data-voice-status></p>
    <div class="row">
      <select data-voice aria-label="Voice" style="font:inherit;font-size:18px;padding:10px;border-radius:12px;flex:1;min-width:220px"></select>
      <button class="btn" data-test-voice>▶ Test</button>
    </div>
    <div class="row" style="margin-top:12px" role="radiogroup" aria-label="Speed">
      Speed:
      <label><input type="radio" name="speed" value="slower"> Slower</label>
      <label><input type="radio" name="speed" value="normal"> Normal</label>
      <label><input type="radio" name="speed" value="faster"> Faster</label>
    </div>`;
  const voiceSelect = voicePanel.querySelector('[data-voice]');
  function fillVoices() {
    const voices = listVoices();
    voiceSelect.innerHTML = '';
    if (!voices.length) voiceSelect.innerHTML = '<option value="">Default voice</option>';
    for (const [natural, title] of [[true, 'Natural voices'], [false, 'iPad voices']]) {
      const group = voices.filter((v) => v.natural === natural);
      if (!group.length) continue;
      const og = document.createElement('optgroup');
      og.label = title;
      for (const v of group) og.appendChild(new Option(v.label, v.uri));
      voiceSelect.appendChild(og);
    }
    voiceSelect.value = currentVoiceURI();
    voicePanel.querySelector('[data-voice-status]').textContent = voices.some((v) => v.natural)
      ? '✅ Natural voice service is running.'
      : '⚠️ Natural voice service not found — using iPad voices. Check that the "tts" container is running.';
  }
  fillVoices();
  voicesReady.then(fillVoices);
  // iPad loads its voice list a moment after the page opens.
  speechSynthesis?.addEventListener?.('voiceschanged', fillVoices);
  voiceSelect.addEventListener('change', () => {
    setVoice(voiceSelect.value);
    say(`Hi ${KID}! Let's play!`);
  });
  voicePanel.querySelector('[data-test-voice]').addEventListener('click', () => say(`Hi ${KID}! Let's play!`));
  const speed = getSettings().speechRate || 'normal';
  voicePanel.querySelectorAll('input[name=speed]').forEach((r) => {
    r.checked = r.value === speed;
    r.addEventListener('change', () => {
      setSettings({ speechRate: r.value });
      say(`Hi ${KID}! Let's play!`);
    });
  });

  // ---- Pictures ----
  const picturesPanel = el('section', 'panel');
  picturesPanel.innerHTML = `
    <h2>🖼️ Pictures</h2>
    <p data-pictures></p>
    <p>To save one to Photos: Free Play → My Pictures → tap a picture → press and hold it → Save to Photos.</p>
    <button class="btn danger" data-delete-pictures>Delete all pictures</button>`;
  async function showPictureCount() {
    const n = await countPictures();
    picturesPanel.querySelector('[data-pictures]').textContent = `${n} saved picture${n === 1 ? '' : 's'} for ${KID} (newest 50 are kept, and backed up to the computer).`;
  }
  showPictureCount();
  picturesPanel.querySelector('[data-delete-pictures]').addEventListener('click', async () => {
    if (!confirm(`Delete all of ${KID}’s saved pictures? This can’t be undone.`)) return;
    await deleteAllPictures();
    showPictureCount();
  });


  // ---- Players ----
  const AVATARS = ['🦄', '🐶', '🐱', '🐰', '🦖', '🐻', '🦊', '🐼', '🚀', '🌸', '⚽', '🦋'];
  const playersPanel = el('section', 'panel');
  function renderPlayers() {
    const me = currentProfile().id;
    playersPanel.innerHTML = `
      <h2>👧 Players</h2>
      <p>Each player has their own stars, stickers, heart words, pet, pictures and progress.
         With more than one player, the home screen asks who's playing. This page shows <b></b>.</p>
      <ul class="words" data-list></ul>
      <form class="row" style="margin-top:12px">
        <select aria-label="Picture" style="font-size:28px;padding:6px;border-radius:12px">${AVATARS.map((a) => `<option>${a}</option>`).join('')}</select>
        <input type="text" placeholder="Name" aria-label="New player name" maxlength="20">
        <button class="btn" type="submit">Add player</button>
      </form>`;
    playersPanel.querySelector('p b').textContent = currentProfile().name;
    const list = playersPanel.querySelector('[data-list]');
    for (const p of getProfiles()) {
      const li = el('li');
      li.innerHTML = `<span class="w" style="font-size:24px"></span><span class="s"></span>
        <button class="btn light" data-switch>Switch</button>
        <button class="btn light" data-rename>Rename</button>
        ${p.id === 'main' ? '' : '<button class="x" aria-label="Remove player">×</button>'}`;
      li.querySelector('.w').textContent = `${p.avatar} ${p.name}`;
      li.querySelector('.s').textContent = p.id === me ? 'playing now' : '';
      const sw = li.querySelector('[data-switch]');
      if (p.id === me) sw.remove();
      else sw.addEventListener('click', () => { setCurrentProfile(p.id); location.reload(); });
      li.querySelector('[data-rename]').addEventListener('click', () => {
        const name = prompt('New name:', p.name)?.trim();
        if (!name) return;
        updateProfile(p.id, { name: name.slice(0, 20) });
        location.reload();
      });
      li.querySelector('.x')?.addEventListener('click', () => {
        if (!confirm(`Remove ${p.name} and all of their progress?`)) return;
        removeProfile(p.id);
        location.reload();
      });
      list.appendChild(li);
    }
    playersPanel.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = playersPanel.querySelector('input').value.trim().slice(0, 20);
      if (!name) return;
      addProfile(name, playersPanel.querySelector('select').value);
      renderPlayers();
    });
  }
  renderPlayers();

  // ---- Play time ----
  const timePanel = el('section', 'panel');
  const lim = getLimits();
  const played = Math.round(playToday().ms / 60000);
  const bedOptions = ['', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
  const show12 = (t) => {
    const [h, m] = t.split(':').map(Number);
    return `${h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} pm`;
  };
  timePanel.innerHTML = `
    <h2>⏰ Play time</h2>
    <p>When time is up, Sparkle gets sleepy and the games rest. A grown-up can add 15 minutes
       (or end the limit for today) by answering a times-table question.</p>
    <div class="row">
      <label>Daily limit
        <select data-minutes style="font:inherit;padding:8px;border-radius:10px">
          ${[0, 15, 20, 30, 45, 60, 90].map((m) => `<option value="${m}" ${lim.minutes === m ? 'selected' : ''}>${m ? `${m} minutes` : 'No limit'}</option>`).join('')}
        </select></label>
      <label>Bedtime
        <select data-bedtime style="font:inherit;padding:8px;border-radius:10px">
          ${bedOptions.map((t) => `<option value="${t}" ${lim.bedtime === t ? 'selected' : ''}>${t ? show12(t) : 'Off'}</option>`).join('')}
        </select></label>
    </div>
    <p>Played today on this iPad: <b>${played} minute${played === 1 ? '' : 's'}</b></p>`;
  timePanel.querySelector('[data-minutes]').addEventListener('change', (e) => setLimits({ minutes: Number(e.target.value) }));
  timePanel.querySelector('[data-bedtime]').addEventListener('change', (e) => setLimits({ bedtime: e.target.value }));

  // ---- Backup to the computer ----
  const syncPanel = el('section', 'panel');
  syncPanel.innerHTML = `
    <h2>☁️ Backup</h2>
    <p>Stars, stickers, heart words, pets, settings and pictures are copied to the computer running
       the games. On a new iPad (or a new address, or after clearing Safari) they come back by themselves.</p>
    <p data-sync-status>Checking…</p>
    <button class="btn" data-sync>Back up now</button>`;
  async function showSync() {
    await syncNow();
    const st = syncStatus();
    syncPanel.querySelector('[data-sync-status]').textContent = st.online
      ? `✅ Backed up to the computer${st.last ? ` at ${new Date(st.last).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}.`
      : `⚠️ Can't reach the backup service (${st.error}). Check that the "save" container is running.`;
  }
  showSync();
  syncPanel.querySelector('[data-sync]').addEventListener('click', showSync);

  // ---- Microphone (secure address) ----
  const micPanel = el('section', 'panel');
  const host = location.hostname;
  const secureUrl = `https://${host}:2022/`;
  micPanel.innerHTML = `
    <h2>🎤 Microphone</h2>
    <p>Heart Words → <b>Say It!</b> records ${KID} reading a word. Safari only allows the microphone on a
       secure (https) address, which needs a one-time setup:</p>
    <p data-secure></p>
    <ol style="color:var(--muted);line-height:1.5">
      <li>On the computer, put its address in a file named <code>.env</code> next to <code>docker-compose.yml</code>:
          <code>HOST_NAMES=${host}</code>, then run <code>docker compose up -d --build</code>.</li>
      <li>On the iPad, open <a href="/lydias-games-ca.crt"><b>this certificate</b></a> and tap <b>Allow</b>.</li>
      <li>iPad <b>Settings → Profile Downloaded → Install</b>.</li>
      <li>iPad <b>Settings → General → About → Certificate Trust Settings</b> → turn on <b>Lydia's Games Home CA</b>.</li>
      <li>Open <a data-secure-link></a> and use <b>Share → Add to Home Screen</b>. Progress comes along through the backup.</li>
    </ol>`;
  micPanel.querySelector('[data-secure-link]').href = secureUrl;
  micPanel.querySelector('[data-secure-link]').textContent = secureUrl;
  micPanel.querySelector('[data-secure]').textContent = window.isSecureContext && location.protocol === 'https:'
    ? '✅ You are on the secure address. The microphone can be used.'
    : 'ℹ️ This is the regular address, so Say It! is turned off here.';

  // ---- Progress ----
  const progressPanel = el('section', 'panel');
  progressPanel.innerHTML = '<h2>📈 Progress (last 7 days)</h2>';
  const days = lastDays(7);
  const most = Math.max(1, ...days.map((d) => d.total));
  const chart = el('div', 'week-chart');
  for (const d of days) {
    const col = el('div', 'week-col');
    const barEl = el('div', 'week-bar');
    barEl.style.height = `${(d.total / most) * 100}%`;
    barEl.title = `${d.total} rounds`;
    col.append(el('span', 'week-num', d.total ? String(d.total) : ''), barEl, el('span', 'week-day', d.date.toLocaleDateString(undefined, { weekday: 'short' })));
    chart.appendChild(col);
  }
  progressPanel.appendChild(chart);
  const tot = totals(7);
  const acc = accuracy(7);
  const games = Object.keys(GAME_NAMES).filter((g) => tot[g] || acc[g]);
  const table = el('ul', 'words');
  if (!games.length) table.innerHTML = '<li>No rounds yet this week.</li>';
  for (const g of games) {
    const a = acc[g] || { right: 0, wrong: 0 };
    const tries = a.right + a.wrong;
    const li = el('li');
    li.innerHTML = `<span class="w" style="font-size:20px"></span><span class="s"></span>`;
    li.querySelector('.w').textContent = GAME_NAMES[g];
    li.querySelector('.s').textContent = `${tot[g] || 0} rounds${tries ? ` · ${Math.round((a.right / tries) * 100)}% right on the first try` : ''}`;
    table.appendChild(li);
  }
  progressPanel.appendChild(table);
  // Heart words she knows: marked learned, or right 3+ times on the first try
  const words = await getWords();
  const mastered = words.filter((w) => isLearned(w) || getStats(w).right >= 3);
  const practice = words.filter((w) => !mastered.includes(w) && getStats(w).wrong > getStats(w).right);
  const info = el('div');
  info.innerHTML = `
    <p><b>Heart words she knows (${mastered.length} of ${words.length}):</b> <span data-mastered></span></p>
    <p><b>Heart words to practice:</b> <span data-practice></span></p>
    <p><b>Letter mix-ups:</b> <span data-mixups></span></p>
    <p><b>Stars earned ever:</b> ${starsEver()} · <b>Stickers:</b> ${unlockedStickers().length} of ${COLLECTIBLES.length} · <b>Surprises:</b> ${unlockedBonuses().length} of ${BONUSES.length}</p>
    <button class="btn light" data-clear-activity>Clear progress history</button>`;
  info.querySelector('[data-mastered]').textContent = mastered.join(', ') || 'none yet';
  info.querySelector('[data-practice]').textContent = practice.join(', ') || 'none right now';
  const mix = topMixups('letters');
  info.querySelector('[data-mixups]').textContent = mix.length
    ? mix.map(([k, n]) => { const [w, t] = k.split('→'); return `wanted ${w}, tapped ${t} (${n}×)`; }).join('; ')
    : 'none recorded';
  info.querySelector('[data-clear-activity]').addEventListener('click', () => {
    if (!confirm('Clear the progress history? (Stars, stickers and words stay.)')) return;
    clearActivity();
    manage();
  });
  progressPanel.appendChild(info);

  main.append(playersPanel, progressPanel, addPanel, removedPanel, timePanel, syncPanel, voicePanel, micPanel, picturesPanel, backupPanel, settingsPanel);

  async function renderList() {
    const list = addPanel.querySelector('.words');
    list.innerHTML = '';
    const words = await getWords();
    if (!words.length) list.innerHTML = '<li>No words yet — add some above.</li>';
    for (const word of words) {
      const li = el('li');
      const st = getStats(word);
      const tries = st.right + st.wrong;
      li.innerHTML = `
        <span class="w"></span>
        <span class="s">${tries ? `${st.right}/${tries} right` : 'not tried'}</span>
        <label><input type="checkbox" ${isLearned(word) ? 'checked' : ''}> Learned</label>
        <button class="x" aria-label="Remove">×</button>`;
      li.querySelector('.w').textContent = word;
      li.querySelector('input').addEventListener('change', (e) => setLearned(word, e.target.checked));
      li.querySelector('.x').addEventListener('click', async () => {
        await removeWord(word);
        msg.textContent = `Removed: ${word}`;
        renderList();
      });
      list.appendChild(li);
    }

    const removed = await getRemovedStarterWords();
    removedPanel.hidden = !removed.length;
    removedPanel.innerHTML = '<h2>↩️ Removed starter words</h2><p>Tap a word to put it back.</p><div class="row"></div>';
    for (const word of removed) {
      const b = el('button', 'btn light', word);
      b.addEventListener('click', async () => {
        await addWords(word);
        renderList();
      });
      removedPanel.querySelector('.row').appendChild(b);
    }
  }
  renderList();
}

let unlocked = false;
try {
  unlocked = sessionStorage.getItem('lg.grownup') === '1';
} catch {
  /* ask every time */
}
unlocked ? manage() : gate();
