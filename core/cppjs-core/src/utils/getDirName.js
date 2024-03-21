import * as url from 'node:url';

export default function getDirName(importUrl) {
    const filename = url.fileURLToPath(importUrl);
    const temp = filename.split('/'); temp.pop();
    return temp.join('/');
}
