import initCppJs from '../dist/cppjs-sample-backend-nodejs-wasm.node.js';

initCppJs().then(({ Native }) => {
    console.log(`Matrix multiplier with c++ => ${Native.sample()}`);
});
