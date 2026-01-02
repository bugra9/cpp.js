 
 
import state from '../state/index.js';
import { getFilteredTargetSpec } from './target.js';

function getRecursiveData(obj, config, dependency, field, target) {
    const entryArray = getFilteredTargetSpec(dependency?.targetSpecs, target).map(s => s[field]);
    const entries = Object.assign({}, ...entryArray);
    Object.entries(entries).forEach(([dKey, value]) => {
        if (field === 'data') {
            const key = `${dependency.paths.project}/dist/prebuilt/${target.path}/${dKey}`;
            obj[key] = value;
        } else {
            if (typeof value === 'object' && Array.isArray(value)) {
                obj[dKey] = [...(obj[dKey] || []), ...value];
            } else if (typeof value === 'object') {
                obj[dKey] = { ...(obj[dKey] || {}), ...value };
            } else {
                obj[dKey] = value;
            }
        }
    });

    dependency.dependencies.forEach((dep) => {
        getRecursiveData(obj, config, dep, field, target);
    });
}

export default function getData(field, target) {
    const output = {};
    getRecursiveData(output, state.config, state.config, field, target);

    return output;
}
