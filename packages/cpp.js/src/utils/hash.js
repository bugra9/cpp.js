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
