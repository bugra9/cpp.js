import getPathInfo from '../utils/getPathInfo.js';
import { getCliCMakeListsFile } from '../utils/findCMakeListsFile.js';

function setPath(arr, dependency, type, filter = () => {}) {
    if (filter(dependency)) {
        if (type === 'this') {
            arr.push(dependency);
        } else if (Array.isArray(dependency.paths[type])) {
            arr.push(...dependency.paths[type]);
        } else {
            arr.push(dependency.paths[type]);
        }
    }

    dependency.dependencies.forEach((dep) => {
        setPath(arr, dep, type, filter);
    });
}

function getParentPath(path) {
    const pathArray = path.split('/');
    pathArray.pop();
    return pathArray.join('/');
}

function getPath(config, path, pathPrefix) {
    if (!pathPrefix) {
        return getPathInfo(path, config.paths.base).absolute;
    }

    return `${pathPrefix}${getPathInfo(path, config.paths.base).relative}`;
}

let dependencyParams;
export function getDependencyParams(config, pathPrefix) {
    if (dependencyParams) {
        return dependencyParams;
    }

    const sourceFilter = (d) => d === config || d.export.type === 'source';
    let headerPathWithDepends = [];
    setPath(headerPathWithDepends, config, 'header', sourceFilter);
    headerPathWithDepends = [...new Set(headerPathWithDepends.map((p) => getPath(config, p, pathPrefix)))].join(';');

    const headerGlob = [];
    headerPathWithDepends.split(';').forEach((h) => {
        config.ext.header.forEach((ext) => {
            headerGlob.push(`${h}/*.${ext}`);
        });
    });

    let nativePathWithDepends = [];
    setPath(nativePathWithDepends, config, 'native', sourceFilter);
    nativePathWithDepends = [...new Set(nativePathWithDepends.map((p) => getPath(config, p, pathPrefix)))].join(';');

    const nativeGlob = [];
    nativePathWithDepends.split(';').forEach((h) => {
        config.ext.source.forEach((ext) => {
            nativeGlob.push(`${h}/*.${ext}`);
        });
    });

    const cliCMakeListsFile = getCliCMakeListsFile();
    const cmakeFilter = (d) => d !== config && d.export.type === 'cmake' && d.paths.cmake !== cliCMakeListsFile;
    let cmakeDepends = [];
    setPath(cmakeDepends, config, 'this', cmakeFilter);
    cmakeDepends = [...new Set(cmakeDepends)];

    const pathsOfCmakeDepends = [...new Set(cmakeDepends
        .map((d) => getParentPath(d.paths.cmake))
        .map((p) => getPath(config, p, pathPrefix)))].join(';');
    const nameOfCmakeDepends = [...new Set(cmakeDepends.map((d) => d.general.name))].join(';');

    dependencyParams = {
        nativeGlob,
        headerGlob,
        headerPathWithDepends,
        cmakeDepends,
        pathsOfCmakeDepends,
        nameOfCmakeDepends,
    };
    return dependencyParams;
}

export default function getCmakeParams(config, pathPrefix, isBuildSource, isBuildBridge) {
    const params = [];
    if (isBuildSource) params.push('-DBUILD_SOURCE=TRUE');
    if (isBuildBridge) params.push('-DBUILD_BRIDGE=TRUE');

    const output = getPath(config, config.paths.temp, pathPrefix);
    const projectPath = getPath(config, process.cwd(), pathPrefix);

    const dependParams = getDependencyParams(config, pathPrefix);

    params.push(...[
        `-DBASE_DIR=${projectPath}`,
        `-DNATIVE_GLOB=${dependParams.nativeGlob.join(';')}`,
        `-DHEADER_GLOB=${dependParams.headerGlob.join(';')}`,
        `-DHEADER_DIR=${dependParams.headerPathWithDepends}`,
        `-DDEPENDS_CMAKE_PATHS=${dependParams.pathsOfCmakeDepends}`,
        `-DDEPENDS_CMAKE_NAMES=${dependParams.nameOfCmakeDepends}`,
        `-DBRIDGE_DIR=${output}/bridge`,
    ]);

    return params;
}
