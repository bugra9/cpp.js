export default function getPathInfo(path, base) {
    let basePath = base;

    const output = {
        relative: path,
        absolute: path,
    };
    if (basePath) {
        if (basePath.at(-1) !== '/') basePath += '/';

        if (path.substring(0, basePath.length) === basePath) {
            output.relative = path.substring(basePath.length);
        } else {
            output.absolute = basePath + path;
        }
    }
    return output;
}
