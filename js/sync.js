// Backup to the computer running the games (the "save" container), so stars, stickers, words,
// pets and pictures survive a new iPad, cleared Safari data, or a change of address.
//
// localStorage stays the working copy. On each page load we compare with the computer's copy:
//   - nothing here yet (new iPad / new address)  -> restore everything from the computer
//   - the computer has newer changes, none here  -> take them
//   - both changed                                -> merge (star counts: the bigger one; else this iPad's)
// Then changes here are sent a couple of seconds after they happen.
import { allKeys, DEVICE_KEYS, onChange } from './storage.js';

const API = new URL('../api/', import.meta.url);
const META = 'lg.sync';
const COUNTERS = /\.(stars|starsEver)$/;

let status = { online: null, rev: 0, last: 0, error: '' };
export const syncStatus = () => ({ ...status });

function meta() {
  try {
    return { rev: 0, hash: '', deleted: [], ...JSON.parse(localStorage.getItem(META) || '{}') };
  } catch {
    return { rev: 0, hash: '', deleted: [] };
  }
}
function setMeta(m) {
  try {
    localStorage.setItem(META, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

function snapshot() {
  const out = {};
  for (const k of allKeys().sort()) if (!DEVICE_KEYS.includes(k)) out[k] = localStorage.getItem(k);
  return out;
}
function hash(obj) {
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `${s.length}:${h.toString(36)}`;
}
// "Empty" = only settings so far: a fresh iPad or a new address.
const isFresh = (snap) => Object.keys(snap).every((k) => k === 'lg.settings');

function apply(data) {
  const before = snapshot();
  for (const k of Object.keys(before)) if (!(k in data)) localStorage.removeItem(k);
  for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
  return hash(before) !== hash(snapshot());
}

function merge(local, server) {
  const out = { ...server, ...local };
  for (const k of Object.keys(out)) {
    if (COUNTERS.test(k) && k in server && k in local) out[k] = String(Math.max(Number(local[k]) || 0, Number(server[k]) || 0));
  }
  return out;
}

async function api(path, opts = {}) {
  const res = await fetch(new URL(path, API), { cache: 'no-store', ...opts });
  return res;
}

async function push(data, baseRev, retry = true) {
  const res = await api('state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ baseRev, data }),
    keepalive: JSON.stringify(data).length < 60000,
  });
  if (res.status === 409 && retry) {
    // Another iPad saved first: merge with theirs and try again.
    const server = await res.json();
    const merged = merge(data, server.data || {});
    apply(merged);
    return push(merged, server.rev, false);
  }
  if (!res.ok) throw new Error(`save ${res.status}`);
  const { rev } = await res.json();
  setMeta({ ...meta(), rev, hash: hash(data) });
  status = { ...status, online: true, rev, last: Date.now(), error: '' };
}

// One sync at a time; asking while one runs waits for that one.
let inflight = null;
export function syncNow() {
  inflight ||= doSync().finally(() => (inflight = null));
  return inflight;
}
async function doSync() {
  try {
    const res = await api('state');
    if (!res.ok) throw new Error(`load ${res.status}`);
    const server = await res.json();
    const m = meta();
    const local = snapshot();
    const changedHere = hash(local) !== m.hash;
    status = { ...status, online: true, rev: server.rev };
    if (server.rev > m.rev) {
      if (!changedHere || isFresh(local)) {
        const changed = apply(server.data || {});
        setMeta({ ...m, rev: server.rev, hash: hash(snapshot()) });
        status.last = Date.now();
        if (changed) reloadOnce();
      } else {
        const merged = merge(local, server.data || {});
        if (apply(merged)) reloadOnce();
        await push(merged, server.rev);
      }
    } else if (changedHere) {
      await push(local, server.rev);
    } else {
      status.last = Date.now();
    }
    await syncPictures();
  } catch (e) {
    status = { ...status, online: false, error: String(e.message || e) };
  }
}

// After restoring, reload once so the page shows the restored stars, pet, etc.
// Never once she has started tapping: the new data then shows up on the next page instead.
let touched = false;
document.addEventListener('pointerdown', () => (touched = true), { once: true, capture: true });
function reloadOnce() {
  if (touched) return;
  try {
    if (sessionStorage.getItem('lg.restored')) return;
    sessionStorage.setItem('lg.restored', '1');
  } catch {
    return;
  }
  location.reload();
}

// ---------- Pictures ----------
async function syncPictures() {
  const gallery = await import('./gallery-store.js');
  const m = meta();
  // Deletions made while the computer was unreachable.
  for (const id of m.deleted || []) await api(`pictures/${id}`, { method: 'DELETE' }).catch(() => {});
  setMeta({ ...meta(), deleted: [] });
  const res = await api('pictures');
  if (!res.ok) return;
  const remote = new Map((await res.json()).map((p) => [String(p.id), p]));
  const local = await gallery.allPictures();
  const localIds = new Set(local.map((p) => String(p.id)));
  for (const pic of local) if (!remote.has(String(pic.id))) await uploadPicture(pic);
  let restored = 0;
  for (const id of remote.keys()) {
    if (localIds.has(id)) continue;
    const r = await api(`pictures/${id}`);
    if (r.ok) {
      await gallery.putPicture(await r.json());
      restored++;
    }
  }
  if (restored) status.picturesRestored = restored;
}

export async function uploadPicture(pic) {
  try {
    await api(`pictures/${pic.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pic) });
  } catch {
    /* sent on the next sync */
  }
}
export async function forgetPicture(id) {
  try {
    const r = await api(`pictures/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error();
  } catch {
    setMeta({ ...meta(), deleted: [...(meta().deleted || []), id] });
  }
}

// ---------- When to sync ----------
let timer = null;
function soon() {
  clearTimeout(timer);
  timer = setTimeout(syncNow, 2000);
}
onChange(soon);
// Some modules write localStorage directly (music on/off); a slow check catches those.
setInterval(() => {
  if (hash(snapshot()) !== meta().hash) soon();
}, 30000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hash(snapshot()) !== meta().hash) {
    const m = meta();
    push(snapshot(), m.rev, false).catch(() => {});
  }
});
syncNow();
