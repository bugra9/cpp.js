import glob from 'glob';
import getParentPath from './getParentPath.js';

export default function getCMakeListsFilePath(basePath = process.cwd()) {
    let temp = glob.sync('CMakeLists.txt', { absolute: true, cwd: basePath });
    if (temp.length === 0) {
        temp = glob.sync('*/CMakeLists.txt', { absolute: true, cwd: basePath, ignore: ['node_modules/*', 'dist/*', 'build/*'] });
    }

    if (temp.length > 0) return temp[0];
    return getCliCMakeListsFile();
}

export function getCliCMakeListsFile() {
    const cliPath = getParentPath(getParentPath(import.meta.url));
    return `${cliPath}/assets/CMakeLists.txt`;
}
