import fs from 'node:fs';
import logger from '../utils/logger.js';

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

    // Cargo packages expose the same generated dist/prebuilt CMakeLists as cmake packages, so
    // they join the cmake depends graph (this is how their .a reaches the android link).
    const cmakeFilter = (d) => d !== config && (d.export.type === 'cmake' || d.export.type === 'cargo') && d.paths.cmake !== config.paths.cliCMakeListsTxt;
    let cmakeDepends = [];
    setPath(cmakeDepends, config, 'this', cmakeFilter);
    cmakeDepends = [...new Set(cmakeDepends)];

    const getCmakeDepends = (target, variants = []) => {
        return cmakeDepends.filter(d => d.functions.isEnabled(target, variants));
    };

    // A dependency that resolves to no prebuilt for this target drops out of the link list.
    // For platform-split packages (a port's -android / -ios sibling) that is normal - only one
    // of them serves any given build. A cargo package has no such split: one package carries
    // every target, so a missing one means its artifacts were never built, and linking without
    // it produces a binary that builds clean and dies at init.
    const assertDependsBuilt = (target, variants) => {
        cmakeDepends.filter((d) => !d.functions.isEnabled(target, variants)).forEach((d) => {
            if (d.export.type === 'cargo') {
                throw new Error(`crossbind: dependency "${d.general.name}" has no prebuilt for ${target.path} `
                    + `(looked in ${d.paths.cmakeDir}). Build it for this target before building the app.`);
            }
            if (!fs.existsSync(d.paths.cmakeDir)) {
                logger.info(`crossbind: dependency "${d.general.name}" has no prebuilt artifacts at all `
                    + `(${d.paths.cmakeDir} missing) - excluded from the ${target.platform} link.`);
            }
        });
    };

    const getCmakeDependsPathAndName = (target, variants = []) => {
        assertDependsBuilt(target, variants);
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
