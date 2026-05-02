import initCppJs from '../dist/cppjs-sample-backend-nodejs-wasm-multithread-wasm-wasm32-mt-release.node.js';

initCppJs().then(async ({ Native }) => {
    console.log(`Matrix multiplier with c++ => ${await Native.sample()}`);
    await Native.runOnThread();
    setTimeout(async () => {
        console.log(`Thread result: ${await Native.getThreadResult()}`);
    }, 1000);
});
