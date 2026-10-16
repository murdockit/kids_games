// "My Pictures": saved drawings, kept on this iPad in IndexedDB (PNG data is too big for localStorage).
// Each picture: { id, profile, created, pageId, thumb, image, paint, width, height }
// Pictures belong to the player who drew them, and are backed up to the computer (sync.js).
import { currentProfile } from './storage.js';

const mine = (p) => (p.profile || 'main') === currentProfile().id;
const backup = () => import('./sync.js');
//   thumb/image are data URLs of the finished picture; paint is the paint layer alone, for "keep drawing".
const DB_NAME = 'lydias-games';
const STORE = 'pictures';
const KEEP = 50;

let dbPromise = null;
function db() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('No IndexedDB'));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => (dbPromise = null));
  }
  return dbPromise;
}

async function run(mode, fn) {
  const conn = await db();
  return new Promise((resolve, reject) => {
    const tx = conn.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

// Every player's pictures (for the backup).
export async function allPictures() {
  try {
    return (await run('readonly', (s) => s.getAll())) || [];
  } catch {
    return [];
  }
}

// Puts back a picture from the backup.
export async function putPicture(record) {
  await run('readwrite', (s) => s.put(record));
}

export async function listPictures() {
  return (await allPictures()).filter(mine).sort((a, b) => b.created - a.created);
}

export async function getPicture(id) {
  try {
    return await run('readonly', (s) => s.get(id));
  } catch {
    return null;
  }
}

// Saves (or updates, when picture.id is set) and trims to the newest KEEP pictures.
export async function savePicture(picture) {
  const record = { ...picture, id: picture.id || Date.now(), created: Date.now(), profile: currentProfile().id };
  await run('readwrite', (s) => s.put(record));
  backup().then((m) => m.uploadPicture(record)).catch(() => {});
  const all = await listPictures();
  for (const old of all.slice(KEEP)) await deletePicture(old.id);
  return record.id;
}

export async function deletePicture(id) {
  try {
    await run('readwrite', (s) => s.delete(id));
  } catch {
    /* already gone */
  }
  backup().then((m) => m.forgetPicture(id)).catch(() => {});
}

export async function countPictures() {
  return (await listPictures()).length;
}

// Deletes this player's pictures.
export async function deleteAllPictures() {
  for (const p of await listPictures()) await deletePicture(p.id);
}
