import initCppJs from '../dist/cppjs-sample-backend-nodejs-wasm-wasm-wasm32-st-release.node.bundle.js';

function wait(ms, fn) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fn());
        }, ms);
    });
}

initCppJs().then(async ({ Native }) => {
    try {
        await Native.ops_JSPI();
        const z = Native.sample();

        console.log(`${z}`);
    } catch (e) {
        console.error(e, e.message, e.stack);
    }
});
