import * as url from 'node:url';

const filename = url.fileURLToPath(import.meta.url);
const temp = filename.split('/');
temp.pop();
temp.pop();
const dirname = temp.join('/');

export default function getCliPath() {
    return dirname;
}
