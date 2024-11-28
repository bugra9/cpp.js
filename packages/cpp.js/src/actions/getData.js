/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
import state from '../state/index.js';

function getRecursiveData(obj, config, dependency, field, platform, subPlatform) {
    const platformName = subPlatform ? `${platform}-${subPlatform}` : platform;
    if (dependency?.platform?.[platformName]?.[field]) {
        Object.entries(dependency.platform[platformName][field]).forEach(([dKey, value]) => {
            if (field === 'data') {
                const key = `${dependency.paths.project}/dist/prebuilt/${platform}/${dKey}`;
                obj[key] = value;
            } else {
                obj[dKey] = value;
            }
        });
    }

    dependency.dependencies.forEach((dep) => {
        getRecursiveData(obj, config, dep, field, platform, subPlatform);
    });
}

export default function getData(field, platform = 'Emscripten-x86_64', subPlatform) {
    const output = {};
    getRecursiveData(output, state.config, state.config, field, platform, subPlatform);

    return output;
}
