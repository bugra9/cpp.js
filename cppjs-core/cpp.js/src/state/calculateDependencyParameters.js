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

    const getCmakeDepends = (target, variants = []) => {
        return cmakeDepends.filter(d => d.functions.isEnabled(target, variants));
    };

    const getCmakeDependsPathAndName = (target, variants = []) => {
        const pathsOfCmakeDepends = [];
        const nameOfCmakeDepends = [];
        getCmakeDepends(target, variants).forEach((d) => {
            const dependPath = d.paths.cmakeDir;
            if (!pathsOfCmakeDepends.includes(dependPath)) {
                pathsOfCmakeDepends.push(dependPath);
                nameOfCmakeDepends.push(d.general.name);
            }
        });
        return {
            pathsOfCmakeDepends: pathsOfCmakeDepends,
            nameOfCmakeDepends: nameOfCmakeDepends,
        };
    }

    return {
        nativeGlob,
        headerGlob,
        headerPathWithDepends,
        getCmakeDepends,
        getCmakeDependsPathAndName,
    };
}

function setPath(arr, dependency, type, filter = () => { }) {
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
