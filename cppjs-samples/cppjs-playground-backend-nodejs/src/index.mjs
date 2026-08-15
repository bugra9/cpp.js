import initNative from '../dist/cppjs-sample-backend-nodejs-wasm-wasm-wasm32-st-release.node.js';

function wait(ms, fn) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fn());
        }, ms);
    });
}

import { runConformance } from '@cpp.js/conformance/spec/run.mjs';

initNative().then(async (m) => {
    const { Native } = m;
    try {
        await Native.ops_JSPI();
        const z = Native.sample();

        console.log(`${z}`);
    } catch (e) {
        console.error(e, e.message, e.stack);
    }

    // Shared conformance list. The standalone node runtime is the direct module (no
    // bundler, no worker): full C++ + Rust-package + live-JS surfaces; the bundler-only
    // sections (app-local .rs, cargo: imports) report as explicit skips.
    try {
        const result = await runConformance({
            cpp: { ConfBox: m.ConfBox, ConfCircle: m.ConfCircle, ConfOps: m.ConfOps },
            rustPkg: {
                RustyCounter: m.RustyCounter,
                Widget: m.Widget,
                Gauge: m.Gauge,
                Mode: m.Mode,
                RustIntVector: m.RustIntVector,
                doubleIt: m.doubleIt,
                greet: m.greet,
                checkedParse: m.checkedParse,
                parseEven: m.parseEven,
                tag: m.tag,
                jsonEcho: m.jsonEcho,
                jsonTally: m.jsonTally,
                jsonPick: m.jsonPick,
                SharedDoc: m.SharedDoc,
                dupDoc: m.dupDoc,
                sharedDropCount: m.sharedDropCount,
            },
            rustAppLocal: null,
            rustCrates: null,
            jsLive: {
                jsPass: m.jsPass,
                jsProbe: m.jsProbe,
                jsCall: m.jsCall,
                jsStore: m.jsStore,
                jsFire: m.jsFire,
            },
            caps: {},
        });
        console.log(result.summary);
        if (result.pass !== result.run) console.log(result.lines.join('\n'));
    } catch (e) {
        console.error('CONFORMANCE ERR:', e?.message ?? e);
    }
});
