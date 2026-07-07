import { describe, test, expect } from 'vitest';
import fsBrowser from '../src/assets/js-runtime/adapters/fs-browser.js';

// Emscripten prefers mainScriptUrlOrBlob over its own script detection when
// spawning pthread workers; an unguarded locateFile(undefined) used to set it
// to the literal string "undefined" and hang direct-mode init on the 0.3.3
// toolchain (new Worker("/undefined")).
function makeModule() {
    return { locateFile: (path) => `/${path}` };
}

describe('fs-browser extendModule mainScriptUrlOrBlob', () => {
    test('uses paths.worker when set', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: { worker: 'my.worker.js' } });
        expect(m.mainScriptUrlOrBlob).toBe('/my.worker.js');
    });

    test('falls back to paths.js', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: { js: 'cpp.js' } });
        expect(m.mainScriptUrlOrBlob).toBe('/cpp.js');
    });

    test('leaves the property unset when no script path is known', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: {} });
        expect('mainScriptUrlOrBlob' in m).toBe(false);
    });
});
