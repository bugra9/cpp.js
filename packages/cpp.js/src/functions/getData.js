/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
import getPathInfo from '../utils/getPathInfo.js';

function getPath(config, path, pathPrefix) {
    if (!pathPrefix) {
        return getPathInfo(path, config.paths.base).absolute;
    }
    return `${pathPrefix}${getPathInfo(path, config.paths.base).relative}`;
}

function getRecursiveData(obj, config, dependency, field, pathPrefix, platform, subPlatform) {
    const platformName = subPlatform ? `${platform}-${subPlatform}` : platform;
    if (dependency?.platform?.[platformName]?.[field]) {
        Object.entries(dependency.platform[platformName][field]).forEach(([dKey, value]) => {
            if (field === 'data') {
                const a = `${dependency.paths.project}/dist/prebuilt/${platform}/${dKey}`;
                const key = getPath(config, a, pathPrefix);
                obj[key] = value;
            } else {
                obj[dKey] = value;
            }
        });
    }

    dependency.dependencies.forEach((dep) => {
        getRecursiveData(obj, config, dep, field, pathPrefix, platform, subPlatform);
    });
}

export default function getData(config, field, pathPrefix, platform = 'Emscripten-x86_64', subPlatform) {
    const output = {};
    getRecursiveData(output, config, config, field, pathPrefix, platform, subPlatform);

    return output;
}
