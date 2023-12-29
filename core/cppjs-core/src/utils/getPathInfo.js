import p from 'path';

export default function getPathInfo(path, base) {
    const output = {
        relative: p.relative(base, path),
        absolute: path,
    };

    return output;
}
