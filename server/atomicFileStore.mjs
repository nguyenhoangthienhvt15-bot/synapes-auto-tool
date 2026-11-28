import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const FILE_MUTEX_QUEUES = new Map();

/**
 * Serializes async read-modify-write critical sections per resolved file path
 * so concurrent API requests never clobber JSON registries or drop updates.
 */
export async function withFileLock(filePath, taskFn) {
  const key = path.resolve(String(filePath || 'default'));
  const prev = FILE_MUTEX_QUEUES.get(key) || Promise.resolve();
  const gate = prev.catch(() => {}).then(() => taskFn());
  const cleanup = gate.then(
    () => {},
    () => {}
  );
  FILE_MUTEX_QUEUES.set(key, cleanup);
  try {
    return await gate;
  } finally {
    if (FILE_MUTEX_QUEUES.get(key) === cleanup) {
      FILE_MUTEX_QUEUES.delete(key);
    }
  }
}

/**
 * Atomically writes text to disk via unique same-directory temp file + renameSync.
 */
export function writeTextAtomic(filePath, content) {
  const resolved = path.resolve(String(filePath || ''));
  const dir = path.dirname(resolved);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${resolved}.${process.pid}.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tmpPath, String(content ?? ''), 'utf8');
    fs.renameSync(tmpPath, resolved);
  } catch (err) {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch {
      // ignore cleanup error
    }
    throw err;
  }
}

/**
 * Atomically serializes JSON to disk via temp file + renameSync.
 */
export function writeJsonAtomic(filePath, data, spaces = 2) {
  const jsonText = JSON.stringify(data, null, spaces);
  writeTextAtomic(filePath, jsonText);
}
