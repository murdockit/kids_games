// Grown-ups screen: manage heart words, back up / restore, and settings.
import { topBar, randInt, getSettings, setSettings, resetStars, el } from './common.js';
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
    <p>Add words Lydia is learning. Separate several with commas.</p>
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
    <h2>💾 Backup</h2>
    <p>Word changes are saved on this iPad only. Export a backup to keep them safe or move them to another device.
       The exported file can also replace <code>data/heart-words.json</code> on the computer running the games.</p>
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
      <div class="row">
        <button class="btn danger" data-reset-stars>Reset stars</button>
        <button class="btn danger" data-reset-stats>Reset heart word scores</button>
      </div>
    </div>
    <p class="msg"></p>`;
  const settingsMsg = settingsPanel.querySelector('.msg');
  settingsPanel.querySelectorAll('[data-set]').forEach((box) =>
    box.addEventListener('change', () => setSettings({ [box.dataset.set]: box.checked })),
  );
  settingsPanel.querySelector('[data-reset-stars]').addEventListener('click', () => {
    if (!confirm('Reset Lydia’s stars to 0?')) return;
    resetStars();
    settingsMsg.textContent = 'Stars reset.';
  });
  settingsPanel.querySelector('[data-reset-stats]').addEventListener('click', () => {
    if (!confirm('Reset the right/wrong scores for every heart word?')) return;
    resetStats();
    renderList();
    settingsMsg.textContent = 'Scores reset.';
  });

  main.append(addPanel, removedPanel, backupPanel, settingsPanel);

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
