// Everything the games remember lives in localStorage under "lg." keys (pictures live in IndexedDB).
//
// Players: the first player keeps the plain keys (so nothing moves for Lydia). Each extra player's
// keys get their own prefix, e.g. "lg.p.k3x9.stars". Settings, the player list and time limits are
// shared by everyone on the iPad.
const DEFAULT = { id: 'main', name: 'Lydia', avatar: '🦄' };
const PROFILES_KEY = 'lg.profiles';
const CURRENT_KEY = 'lg.profile';
// Shared by all players on this iPad (not per player).
export const SHARED_KEYS = ['lg.settings', PROFILES_KEY, CURRENT_KEY, 'lg.limits', 'lg.playtime', 'lg.sync'];
// Kept on this iPad only, never backed up to the computer.
export const DEVICE_KEYS = [CURRENT_KEY, 'lg.playtime', 'lg.sync'];

function rawGet(key) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? undefined : JSON.parse(v);
  } catch {
    return undefined;
  }
}
function rawSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: progress just isn't remembered */
  }
}

export function getProfiles() {
  const list = rawGet(PROFILES_KEY);
  return Array.isArray(list) && list.length ? list : [DEFAULT];
}
export function currentProfile() {
  const list = getProfiles();
  const id = rawGet(CURRENT_KEY);
  return list.find((p) => p.id === id) || list[0];
}
export function setCurrentProfile(id) {
  rawSet(CURRENT_KEY, id);
}
export function saveProfiles(list) {
  rawSet(PROFILES_KEY, list);
}
export function addProfile(name, avatar) {
  const list = getProfiles();
  const p = { id: Math.random().toString(36).slice(2, 8), name, avatar };
  saveProfiles([...list, p]);
  return p;
}
export function updateProfile(id, patch) {
  saveProfiles(getProfiles().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}
export function removeProfile(id) {
  if (id === 'main') return;
  saveProfiles(getProfiles().filter((p) => p.id !== id));
  const prefix = `lg.p.${id}.`;
  for (const k of allKeys()) if (k.startsWith(prefix)) localStorage.removeItem(k);
  if (rawGet(CURRENT_KEY) === id) setCurrentProfile('main');
}

// The real localStorage key for a game key, for the current player.
export function profileKey(key, profileId = currentProfile().id) {
  if (SHARED_KEYS.includes(key) || profileId === 'main') return key;
  return key.replace(/^lg\./, `lg.p.${profileId}.`);
}

export function load(key, fallback) {
  const v = rawGet(profileKey(key));
  return v === undefined || v === null ? fallback : v;
}
export function save(key, value) {
  rawSet(profileKey(key), value);
  if (!DEVICE_KEYS.includes(key)) notifyChange();
}

export function allKeys() {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith('lg.'));
  } catch {
    return [];
  }
}

// Lets the backup (sync.js) know something changed, without importing it here.
let listener = null;
export function onChange(fn) {
  listener = fn;
}
export function notifyChange() {
  listener?.();
}
