import fs from 'node:fs';
import path from 'node:path';

export default function writeIfChanged(file, content) {
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
}
