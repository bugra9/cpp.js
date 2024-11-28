import * as url from 'node:url';
import upath from 'upath';

export default function getParentPath(importUrl) {
    let input = importUrl;
    try {
        input = url.fileURLToPath(input);
    } catch (e) { /* empty */ }
    const filename = upath.normalize(input);
    const temp = filename.split('/'); temp.pop();
    return temp.join('/');
}
