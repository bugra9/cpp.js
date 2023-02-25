import fs from 'fs';
import p from 'path';

export default function createTempDir(folder = 'a'+Math.random(), base = process.cwd()) {
    const path = p.join(base, 'node_modules', ".cppjs");
    return createDir(folder, path);
}

export function createDir(folder, base = process.cwd()) {
    const path = p.join(base, folder);

    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    fs.mkdirSync(path, { recursive: true });
    return path;
}
