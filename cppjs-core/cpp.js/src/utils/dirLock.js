import fs from 'node:fs';
import path from 'node:path';
import logger from './logger.js';

// A dependency source build can legitimately run for a long time; anything older
// is assumed to be a crashed process whose lock must be broken.
const DEFAULT_STALE_MS = 60 * 60 * 1000;
const DEFAULT_POLL_MS = 2000;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

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
            const mtimeMs = fs.statSync(lockPath, { throwIfNoEntry: false })?.mtimeMs;
            if (mtimeMs !== undefined && Date.now() - mtimeMs > staleMs) {
                logger.info(`cppjs: breaking stale lock ${lockPath}.`);
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
