import * as url from 'node:url';
import upath from 'upath';

const filename = upath.normalize(url.fileURLToPath(import.meta.url));
const temp = filename.split('/');
temp.pop();
temp.pop();
const dirname = temp.join('/');

export default function getCliPath() {
    return dirname;
}
