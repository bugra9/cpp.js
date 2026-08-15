import initNative from '../dist/cppjs-sample-backend-nodejs-wasm-wasm-wasm32-mt-release.node.js';
import { runConformance } from '@cpp.js/conformance/spec/run.mjs';

function wait(ms, fn) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fn());
        }, ms);
    });
}

initNative().then(async (m) => {
    const { Native } = m;
    try {
        Native.runOnThread();
        await Native.ops_JSPI();
        const z = Native.sample();
        const threadResult = await wait(5000, () => Native.getThreadResult());

        console.log(`${z} - ${threadResult}`);
    } catch (e) {
        console.error(e, e.message, e.stack);
    }

    // Shared conformance list. The mt node runtime is still the direct module (pthreads
    // live in worker_threads, bindings stay synchronous on the main thread), so the full
    // direct surface runs - same shape as the st node leg.
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
