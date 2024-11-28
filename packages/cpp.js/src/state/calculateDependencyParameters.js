export default function calculateDependencyParameters(config) {
    const sourceFilter = (d) => d === config || d.export.type === 'source';
    let headerPathWithDepends = [];
    setPath(headerPathWithDepends, config, 'header', sourceFilter);
    headerPathWithDepends = [...new Set(headerPathWithDepends)].join(';');

    const headerGlob = [];
    headerPathWithDepends.split(';').forEach((h) => {
        config.ext.header.forEach((ext) => {
            headerGlob.push(`${h}/*.${ext}`);
        });
    });

    let nativePathWithDepends = [];
    setPath(nativePathWithDepends, config, 'native', sourceFilter);
    nativePathWithDepends = [...new Set(nativePathWithDepends)].join(';');

    const nativeGlob = [];
    nativePathWithDepends.split(';').forEach((h) => {
        config.ext.source.forEach((ext) => {
            nativeGlob.push(`${h}/*.${ext}`);
        });
    });

    const cmakeFilter = (d) => d !== config && d.export.type === 'cmake' && d.paths.cmake !== config.paths.cliCMakeListsTxt;
    let cmakeDepends = [];
    setPath(cmakeDepends, config, 'this', cmakeFilter);
    cmakeDepends = [...new Set(cmakeDepends)];

    const pathsOfCmakeDepends = [...new Set(cmakeDepends
        .map((d) => getParentPath(d.paths.cmake)))].join(';');
    const nameOfCmakeDepends = [...new Set(cmakeDepends.map((d) => d.general.name))].join(';');

    return {
        nativeGlob,
        headerGlob,
        headerPathWithDepends,
        cmakeDepends,
        pathsOfCmakeDepends,
        nameOfCmakeDepends,
    };
}

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
