export default function fixPackageName(name) {
    if (!name) {
        return null;
    }

    return name.replace(/[^a-zA-Z0-9-_]+/g, '');
}
