import upath from 'upath';

export default function getAbsolutePath(projectPath, path) {
    if (!path) {
        return null;
    }
    if (upath.isAbsolute(path)) {
        return path;
    }
    if (projectPath) {
        return upath.resolve(upath.join(upath.resolve(projectPath), path));
    }
    return upath.resolve(path);
}
