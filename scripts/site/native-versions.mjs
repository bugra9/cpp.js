import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Examples print the native versions they run, so their expected output reads those versions from
// the packages instead of spelling them out; a native update then breaks no check on its own.
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PORT_PREFIX = '@crossbind/port-';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// A family's base package, the one carrying the upstream license record, names the family and the
// native version its platform packages were built from.
export function readNativeVersions(project) {
    const scope = path.join(project, 'node_modules', '@crossbind');
    if (!fs.existsSync(scope)) return {};
    return Object.fromEntries(
        fs
            .readdirSync(scope)
            .map((entry) => path.join(scope, entry, 'package.json'))
            .filter((file) => fs.existsSync(file))
            .map(readJson)
            .filter((manifest) => manifest.name?.startsWith(PORT_PREFIX) && manifest.crossbind?.upstream && manifest.nativeVersion)
            .map((manifest) => [manifest.name.slice(PORT_PREFIX.length), manifest.nativeVersion]),
    );
}

export function repoNativeVersions(root = REPOSITORY_ROOT) {
    const ports = path.join(root, 'ports');
    if (!fs.existsSync(ports)) return {};
    return Object.fromEntries(
        fs
            .readdirSync(ports)
            .map((family) => path.join(ports, family, 'base', 'package.json'))
            .filter((file) => fs.existsSync(file))
            .map(readJson)
            .filter((manifest) => manifest.name?.startsWith(PORT_PREFIX) && manifest.nativeVersion)
            .map((manifest) => [manifest.name.slice(PORT_PREFIX.length), manifest.nativeVersion]),
    );
}

// The site runs its examples against the live demos, so the versions those installed win; a family
// no demo installed, or a build without demos, falls back to the repository's ports.
export const siteNativeVersions = (manifest, root = REPOSITORY_ROOT) =>
    Object.assign({}, repoNativeVersions(root), ...(manifest?.demos ?? []).map((demo) => demo.nativeVersions ?? {}));

export const resolveExpected = (expected, versions) => (typeof expected === 'function' ? expected(versions) : expected);
