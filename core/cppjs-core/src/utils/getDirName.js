import * as url from 'node:url';
import upath from 'upath';

export default function getDirName(importUrl) {
    const filename = upath.normalize(url.fileURLToPath(importUrl));
    const temp = filename.split('/'); temp.pop();
    return temp.join('/');
}
