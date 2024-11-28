import fs from 'node:fs';

export default function loadJson(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const stateContent = fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' });
        const state = JSON.parse(stateContent);
        return state;
    } catch (e) {
        console.error(e);
        return null;
    }
}
