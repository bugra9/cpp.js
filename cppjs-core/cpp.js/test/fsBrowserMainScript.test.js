import { describe, test, expect } from 'vitest';
import fsBrowser from '../src/assets/js-runtime/adapters/fs-browser.js';

// The pthread spawn script is handed to the glue via the cppjs-specific
// cppjsMainScript key (buildWasm rewrites the bootstrap to read it). Using
// emscripten's own mainScriptUrlOrBlob aborted emsdk 6 debug builds on
// single-thread targets, and an unguarded locateFile(undefined) used to set
// the literal string "undefined" and hang direct-mode init
// (new Worker("/undefined")).
function makeModule() {
    return { locateFile: (path) => `/${path}` };
}

describe('fs-browser extendModule cppjsMainScript', () => {
    test('uses paths.worker when set', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: { worker: 'my.worker.js' } });
        expect(m.cppjsMainScript).toBe('/my.worker.js');
    });

    test('falls back to paths.js', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: { js: 'cpp.js' } });
        expect(m.cppjsMainScript).toBe('/cpp.js');
    });

    test('leaves the property unset when no script path is known', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: {} });
        expect('cppjsMainScript' in m).toBe(false);
    });

    test('never sets emscripten-validated mainScriptUrlOrBlob', () => {
        const m = makeModule();
        fsBrowser.extendModule(m, { paths: { worker: 'my.worker.js', js: 'cpp.js' } });
        expect('mainScriptUrlOrBlob' in m).toBe(false);
    });
});
