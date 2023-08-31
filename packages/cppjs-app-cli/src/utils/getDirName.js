import * as url from 'node:url';

export default function getDirName(importUrl) {
    const __filename = url.fileURLToPath(importUrl);
    const temp = __filename.split('/'); temp.pop();
    return temp.join('/');
}
