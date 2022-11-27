import fs from 'fs';
import glob from 'glob';
import {dirname} from 'path';
import * as url from 'node:url';

export const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = dirname(dirname(__filename)+'..');

export default function findCMakeListsFile() {
    let temp = glob.sync("CMakeLists.txt", { absolute: true });
    if (temp.length === 0) {
        temp = glob.sync("*/CMakeLists.txt", { absolute: true, ignore: ['node_modules/*', 'dist/*', 'build/*'] });
    }

    if (temp.length > 0) return temp[0];
    return __dirname + '/assets/CMakeLists.txt';
}
