import initCppJs from '../dist/cppjs-sample-backend-nodejs-wasm.node.js';

function wait(ms, fn) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(fn());
        }, ms);
    });
}

initCppJs().then(async ({ Native }) => {
    try {
        Native.runOnThread();
        await Native.ops_JSPI();
        const z = Native.sample();
        const threadResult = await wait(5000, () => Native.getThreadResult());

        console.log(`${z} - ${threadResult}`);
    } catch (e) {
        console.error(e, e.message, e.stack);
    }
});
