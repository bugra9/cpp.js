import fs from 'node:fs';
import findFiles from './findFiles.js';
import { getContentHash, getFileHash } from './hash.js';

const EXCLUDED_DIRS = ['node_modules', '.cppjs', 'android', 'ios', 'build', 'dist', '.git'];

export function collectInputFiles(roots, exts, extraFiles = []) {
    // A single-entry brace set ({js}) is not brace-expanded by glob; use a plain suffix then.
    const pattern = exts.length === 1 ? `**/*.${exts[0]}` : `**/*.{${exts.join(',')}}`;
    const files = new Set();
    [...new Set(roots)].forEach((root) => {
        findFiles(pattern, {
            cwd: root,
            ignore: EXCLUDED_DIRS.map((dir) => `**/${dir}/**`),
        }).forEach((file) => files.add(file));
        if (fs.existsSync(`${root}/package.json`)) files.add(`${root}/package.json`);
    });
    extraFiles.forEach((file) => files.add(file));
    return [...files].filter((file) => fs.existsSync(file)).sort();
}

export function computeInputStamp(roots, exts, extraFiles, salt) {
    const lines = collectInputFiles(roots, exts, extraFiles).map((file) => `${file}:${getFileHash(file)}`);
    lines.push(salt);
    return getContentHash(lines.join('\n'));
}
