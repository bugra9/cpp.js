import p from 'upath';

export default function getPathInfo(path, base) {
    const output = {
        relative: p.relative(base, path),
        absolute: p.normalize(path),
    };

    return output;
}
