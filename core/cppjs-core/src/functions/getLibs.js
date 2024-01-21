import glob from 'glob';
import getPathInfo from '../utils/getPathInfo.js';
import { getDependencyParams } from './getCmakeParams.js';

function getPath(config, path, pathPrefix) {
    if (!pathPrefix) {
        return getPathInfo(path, config.paths.base).absolute;
    }

    return `${pathPrefix}${getPathInfo(path, config.paths.base).relative}`;
}

export default function getLibs(config, pathPrefix) {
    let dependLibs = [
        ...glob.sync(`${config.paths.temp}/dependencies/**/*.a`, { absolute: true, cwd: config.paths.project }),
    ];
    getDependencyParams(config, pathPrefix).cmakeDepends.forEach((d) => {
        if (d.export.libName) {
            d.export.libName.forEach((fileName) => {
                dependLibs.push(...glob.sync(`${d.paths.output}/prebuilt/Emscripten-x86_64/lib/${fileName}`, { absolute: true, cwd: d.paths.project }));
            });
        }
    });

    dependLibs = [...new Set(dependLibs)];

    return [...new Set([
        `${config.paths.temp}/lib${config.general.name}.a`,
        `${config.paths.temp}/lib${config.general.name}bridge.a`,
        ...dependLibs,
    ].filter((path) => !!path.toString()).map((path) => getPath(config, path, pathPrefix)))];
}
