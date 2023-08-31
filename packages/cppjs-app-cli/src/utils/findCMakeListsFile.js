import glob from 'glob';
import getCliPath from './getCliPath.js';

export default function findCMakeListsFile(basePath = process.cwd()) {
    let temp = glob.sync("CMakeLists.txt", { absolute: true, cwd: basePath });
    if (temp.length === 0) {
        temp = glob.sync("*/CMakeLists.txt", { absolute: true, cwd: basePath, ignore: ['node_modules/*', 'dist/*', 'build/*'] });
    }

    if (temp.length > 0) return temp[0];
    return getCliCMakeListsFile();
}

export function getCliCMakeListsFile() {
    return getCliPath() + '/assets/CMakeLists.txt';
}
