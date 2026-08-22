import Module from 'crossbind/module';
import systemConfig from 'crossbind/systemConfig';

import { createInitCrossbind, composeAdapters } from './core.js';
import urlPath from './adapters/path-url.js';
import browserFs from './adapters/fs-browser.js';
import workerComlink from './adapters/worker-comlink.js';

const adapter = composeAdapters([urlPath, browserFs]);

export default createInitCrossbind({
    Module,
    systemConfig,
    adapter,
    worker: workerComlink,
});
