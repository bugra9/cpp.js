import path from 'node:path';

export const DOCKER_BASE = '/tmp/crossbind/live';

// Whether a container, which sees the project's base alone, sees dir.
export function isUnderBase(dir, basePath) {
    const relative = path.relative(basePath, path.resolve(dir));
    return !/^\.\.(?:[\\/]|$)/.test(relative) && !path.isAbsolute(relative);
}

export default function replaceBasePathForDocker(data, basePath) {
    if (typeof data === 'string' || data instanceof String) {
        return data.replaceAll(basePath, DOCKER_BASE);
    }
    if (Array.isArray(data)) {
        return data.map((d) => replaceBasePathForDocker(d, basePath));
    }
    if (typeof data === 'object' && data !== null) {
        const newData = {};
        Object.entries(data).forEach(([key, value]) => {
            newData[key] = replaceBasePathForDocker(value, basePath);
        });
        return newData;
    }
    return data;
}
