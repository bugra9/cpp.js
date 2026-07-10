import Module from 'cpp.js/module';
import systemConfig from 'cpp.js/systemConfig';

import { createInitCppJs, composeAdapters } from './core.js';
import pathFs from './adapters/path-fs.js';
import nodeFs from './adapters/fs-node.js';

const adapter = composeAdapters([
    pathFs({
        defaultPathPrefix: `${__dirname}/`,
        dataPath: `${__dirname}/data`,
    }),
    nodeFs,
]);

export default createInitCppJs({
    Module,
    systemConfig,
    adapter,
});
