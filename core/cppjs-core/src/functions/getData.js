/* eslint-disable no-param-reassign */
import getPathInfo from '../utils/getPathInfo.js';

const platform = 'Emscripten-x86_64';

function getPath(config, path, pathPrefix) {
    if (!pathPrefix) {
        return getPathInfo(path, config.paths.base).absolute;
    }

    return `${pathPrefix}${getPathInfo(path, config.paths.base).relative}`;
}

function getRecursiveData(obj, dependency, field, pathPrefix) {
    if (dependency?.platform?.[platform]?.[field]) {
        Object.entries(dependency.platform[platform][field]).forEach(([dKey, value]) => {
            if (field === 'data') {
                const a = `${dependency.paths.project}/dist/prebuilt/${platform}/${dKey}`;
                const key = getPath(dependency, a, pathPrefix);
                obj[key] = value;
            } else {
                obj[dKey] = value;
            }
        });
    }

    dependency.dependencies.forEach((dep) => {
        getRecursiveData(obj, dep, field, pathPrefix);
    });
}

export default function getData(config, field, pathPrefix) {
    const output = {};
    getRecursiveData(output, config, field, pathPrefix);

    return output;
}
