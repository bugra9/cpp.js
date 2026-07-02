import fs from 'node:fs';
import path from 'node:path';
import logger from './logger.js';

// A dependency source build can legitimately run for a long time; anything older
// is assumed to be a crashed process whose lock must be broken.
const DEFAULT_STALE_MS = 60 * 60 * 1000;
const DEFAULT_POLL_MS = 2000;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// Reads the PID recorded in the lock file and reports whether that process is
// still running: 'alive' (signal delivered, or owned by another user), 'dead'
// (no such process), or 'unknown' (missing/unparseable PID).
export function lockHolderStatus(lockPath) {
    let pid;
    try {
        pid = Number.parseInt(fs.readFileSync(lockPath, 'utf8').trim(), 10);
    } catch {
        return 'unknown';
    }
    if (!Number.isInteger(pid) || pid <= 0) return 'unknown';
    try {
        process.kill(pid, 0);
        return 'alive';
    } catch (err) {
        if (err.code === 'ESRCH') return 'dead';
        if (err.code === 'EPERM') return 'alive';
        return 'unknown';
    }
}

export default async function withDirLock(lockPath, fn, options = {}) {
    const staleMs = options.staleMs ?? DEFAULT_STALE_MS;
    const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });

    let hasWarned = false;
    for (;;) {
        try {
            const fd = fs.openSync(lockPath, 'wx');
            fs.writeSync(fd, String(process.pid));
            fs.closeSync(fd);
            break;
        } catch (e) {
            if (e.code !== 'EEXIST') throw e;
            const status = lockHolderStatus(lockPath);
            const mtimeMs = fs.statSync(lockPath, { throwIfNoEntry: false })?.mtimeMs;
            const mtimeStale = mtimeMs !== undefined && Date.now() - mtimeMs > staleMs;
            // A provably-dead holder (e.g. a Ctrl-C that skipped the finally cleanup) is broken
            // at once; a live holder is never stolen, even past the stale window; when the holder
            // can't be determined we fall back to the mtime age.
            if (status === 'dead' || (status !== 'alive' && mtimeStale)) {
                logger.info(`cppjs: breaking stale lock ${lockPath} (holder ${status}).`);
                fs.rmSync(lockPath, { force: true });
                continue;
            }
            if (!hasWarned) {
                logger.info(`cppjs: waiting for ${lockPath} (another build is working on this dependency)…`);
                hasWarned = true;
            }
            await sleep(pollMs);
        }
    }

    try {
        return await fn();
    } finally {
        fs.rmSync(lockPath, { force: true });
    }
}
