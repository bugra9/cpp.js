import fs from 'node:fs';

export default function writeJson(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error(e);
    }
}
