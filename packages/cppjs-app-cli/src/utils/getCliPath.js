import {dirname} from 'path';
import * as url from 'node:url';

const __filename = url.fileURLToPath(import.meta.url);
const temp = __filename.split('/');
temp.pop();
temp.pop();
const __dirname = temp.join('/');

export default function getCliPath() {
    return __dirname;
}
