import fs from 'fs';
import p from 'upath';

export default function createTempDir(folder = `a${Math.random()}`, base = process.cwd()) {
    const path = p.join(base, '.cppjs');
    return createDir(folder, path);
}

export function createDir(folder, base = process.cwd()) {
    const path = p.join(base, folder);

    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    fs.mkdirSync(path, { recursive: true });
    return p.normalize(path);
}
