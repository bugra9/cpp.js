import Module from 'crossbind/module';
import systemConfig from 'crossbind/systemConfig';

import { createInitCrossbind, composeAdapters } from './core.js';
import pathFs from './adapters/path-fs.js';
import nodeFs from './adapters/fs-node.js';

const adapter = composeAdapters([
    pathFs({
        defaultPathPrefix: `${__dirname}/`,
        dataPath: `${__dirname}/data`,
    }),
    nodeFs,
]);

export default createInitCrossbind({
    Module,
    systemConfig,
    adapter,
});
