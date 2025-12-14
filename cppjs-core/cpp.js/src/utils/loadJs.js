import fs from 'node:fs';

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
        let file;
        if (typeof module !== 'undefined' && module.exports) {
            file = require(`file:///${filePath}`);
        } else {
            file = await import(`file:///${filePath}`);
        }
        if (file.default) file = file.default;

        if (typeof file === 'function') {
            return file();
        }
        if (typeof file === 'object') {
            return file;
        }
    }

    return null;
}
