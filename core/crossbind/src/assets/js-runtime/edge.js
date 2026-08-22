import Module from 'crossbind/module';
import systemConfig from 'crossbind/systemConfig';

import { createInitCrossbind, composeAdapters } from './core.js';
import pathFs from './adapters/path-fs.js';

const adapter = composeAdapters([
    pathFs({
        defaultPathPrefix: '',
        dataPath: '/crossbind',
    }),
]);

export default createInitCrossbind({
    Module,
    systemConfig,
    adapter,
});
