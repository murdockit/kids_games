// "My Pictures": saved drawings, kept on this iPad in IndexedDB (PNG data is too big for localStorage).
// Each picture: { id, created, pageId, thumb, image, paint, width, height }
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

export async function listPictures() {
  try {
    const all = (await run('readonly', (s) => s.getAll())) || [];
    return all.sort((a, b) => b.created - a.created);
  } catch {
    return [];
  }
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
  const record = { ...picture, id: picture.id || Date.now(), created: Date.now() };
  await run('readwrite', (s) => s.put(record));
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
}

export async function countPictures() {
  try {
    return (await run('readonly', (s) => s.count())) || 0;
  } catch {
    return 0;
  }
}

export async function deleteAllPictures() {
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    /* nothing to clear */
  }
}
