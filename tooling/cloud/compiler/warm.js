// Run once in the image, before the template's warm build (Dockerfile): the template then declares every package and
// imports each as a compile would, so that build fetches and builds all of them. The crates and Conan builds it
// fetched become the store a compile works from offline, and a compile only rewrites these files.
// usage: node warm.js <template dir>
import fs from 'node:fs';
import path from 'node:path';
import { PACKAGES, configSource } from './packages.js';

const template = process.argv[2];
const imported = PACKAGES.filter(({ use }) => use.import);

fs.writeFileSync(path.join(template, 'crossbind.config.js'), configSource(PACKAGES.map(({ id }) => id)));
fs.writeFileSync(path.join(template, 'src', 'main.js'), imported.map(({ use }) => `import { ${use.names.join(', ')} } from '${use.import}';\n`).join(''));
