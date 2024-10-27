export default function getBaseInfo(base) {
    let basePath = base;

    const output = {
        withSlash: '/',
        withoutSlash: '/',
    };
    if (basePath && basePath !== '/') {
        if (basePath.at(-1) !== '/') basePath += '/';

        output.withSlash = basePath;
        output.withoutSlash = basePath.substring(0, basePath.length - 1);
    }
    return output;
}
