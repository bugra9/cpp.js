import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import createCompanionResolver from './resolveCompanionPackage.js';

const PKG = '@crossbind/core-app-host';

const resolveAppHostRoot = createCompanionResolver({
    pkg: PKG,
    siblingDir: 'app-host',
    siblingMarker: 'cpp/src/main.cpp',
    missingMessage: `crossbind: apps need ${PKG} - add it to your devDependencies.`,
});

export default resolveAppHostRoot;

// The embind runtime ships in @crossbind/core-embind-jsi, a dependency of the app host package.
export function resolveAppEmbindJsiRoot() {
    const req = createRequire(path.join(resolveAppHostRoot(), 'package.json'));
    return path.dirname(fs.realpathSync(req.resolve('@crossbind/core-embind-jsi/package.json')));
}
