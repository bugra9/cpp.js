import fs from 'node:fs';
import p from 'node:path';
import state from '../state/index.js';

function newestMtimeInDir(dir) {
    let newest = 0;
    if (!fs.existsSync(dir)) return newest;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = p.join(dir, entry.name);
        if (entry.isDirectory()) {
            const m = newestMtimeInDir(full);
            if (m > newest) newest = m;
        } else if (entry.isFile()) {
            const m = fs.statSync(full).mtimeMs;
            if (m > newest) newest = m;
        }
    }
    return newest;
}

export default function isSourceNewer(target) {
    const artifactPath = `${state.config.paths.build}/${target.jsName}`;
    if (!fs.existsSync(artifactPath)) return false;
    const artifactMtime = fs.statSync(artifactPath).mtimeMs;
    for (const dir of state.config.paths.native) {
        if (newestMtimeInDir(dir) > artifactMtime) return true;
    }
    return false;
}
