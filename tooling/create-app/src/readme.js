// A template's README introduces the published sample on crossbind's beta channel. A scaffolded
// project is a package of its own, installed from its default tag, so the README names it instead.
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function renameInReadme(readme, from, to) {
    const name = escapeRegExp(from);
    const end = '(?![\\w.-])';
    return readme
        .replace(new RegExp(`${name}@beta${end}`, 'g'), to)
        .replace(new RegExp(`npm/v/${name}/beta${end}`, 'g'), `npm/v/${to}`)
        .replace(new RegExp(`${name}${end}`, 'g'), to);
}
