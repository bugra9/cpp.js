import Module from 'cpp.js/module';
import systemConfig from 'cpp.js/systemConfig';

import { createInitCppJs, composeAdapters } from './core.js';
import urlPath from './adapters/path-url.js';
import browserFs from './adapters/fs-browser.js';
import workerComlink from './adapters/worker-comlink.js';

const adapter = composeAdapters([urlPath, browserFs]);

export default createInitCppJs({
    Module,
    systemConfig,
    adapter,
    worker: workerComlink,
});
