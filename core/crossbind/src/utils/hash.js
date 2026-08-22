import fs from 'node:fs';
import { createHash } from 'node:crypto';

export function getFileHash(path) {
    const data = fs.readFileSync(path);
    return getContentHash(data);
    /* return new Promise((resolve, reject) => {
        const hash = createHash('sha256');
        const rs = fs.createReadStream(path);
        rs.on('error', reject);
        rs.on('data', (chunk) => hash.update(chunk));
        rs.on('end', () => resolve(hash.digest('hex')));
    }); */
}

export function getContentHash(content) {
    const hash = createHash('sha256');
    hash.update(content);
    return hash.digest('hex');
}

// Order-insensitive fingerprint of a file LIST (path + content per entry).
// Used as the Bridge lib cache key: the same lib dir is reused while the
// bridge set grows, so a lib built from a different set must not satisfy the
// cache. Missing files fingerprint as such instead of throwing.
export function getFilesFingerprint(paths) {
    return getContentHash(
        (paths || [])
            .map((path) => `${path}:${fs.existsSync(path) ? getFileHash(path) : 'missing'}`)
            .sort()
            .join('\n'),
    );
}
