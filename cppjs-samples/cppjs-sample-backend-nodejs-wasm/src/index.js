const initCppJs = require('../dist/cppjs-sample-backend-nodejs-wasm-wasm-wasm32-st-release.node.js');

initCppJs().then(({ Native }) => {
    console.log(`Matrix multiplier with c++ => ${Native.sample()}`);
});
