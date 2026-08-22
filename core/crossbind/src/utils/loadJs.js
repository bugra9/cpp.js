import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export default async function loadJs(path, fileName, fileExt = ['json', 'js', 'mjs', 'cjs', 'ts']) {
    let filePath;
    fileExt.some((e) => {
        filePath = `${path}/${fileName}.${e}`;
        if (!fs.existsSync(filePath)) {
            filePath = null;
            return false;
        }
        return true;
    });

    if (filePath) {
        let file = filePath.endsWith('.json')
            ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
            : await import(pathToFileURL(filePath).href);

        if (file && file.default) file = file.default;

        if (typeof file === 'function') {
            return file();
        }
        if (typeof file === 'object') {
            return file;
        }
    }

    return null;
}
