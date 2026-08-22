const initNative = require('../dist/crossbind-example-backend-nodejs-wasm-wasm-wasm32-st-release.node.js');

initNative().then(({ Native }) => {
    console.log(`Matrix multiplier with c++ => ${Native.sample()}`);
});
