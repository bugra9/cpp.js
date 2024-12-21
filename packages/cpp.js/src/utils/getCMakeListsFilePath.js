import getParentPath from './getParentPath.js';
import findFiles from './findFiles.js';

export default function getCMakeListsFilePath(basePath = process.cwd()) {
    let temp = findFiles('CMakeLists.txt', { cwd: basePath });
    if (temp.length === 0) {
        temp = findFiles('*/CMakeLists.txt', { cwd: basePath, ignore: ['node_modules/*', 'dist/*', 'build/*'] });
    }

    if (temp.length > 0) return temp[0];
    return getCliCMakeListsFile();
}

export function getCliCMakeListsFile() {
    const cliPath = getParentPath(getParentPath(import.meta.url));
    return `${cliPath}/assets/CMakeLists.txt`;
}
