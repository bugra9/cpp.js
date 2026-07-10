import Module from 'cpp.js/module';
import systemConfig from 'cpp.js/systemConfig';

import { createInitCppJs, composeAdapters } from './core.js';
import pathFs from './adapters/path-fs.js';

const adapter = composeAdapters([
    pathFs({
        defaultPathPrefix: '',
        dataPath: '/cppjs',
    }),
]);

export default createInitCppJs({
    Module,
    systemConfig,
    adapter,
});
