import libSampleBasic from 'cppjs-lib-samplebasic-wasm/cppjs.config.js';
import libSampleComplex from 'cppjs-lib-samplecomplex-wasm/cppjs.config.js';
import sampleReactCra from 'cppjs-sample-react-cra/cppjs.config.js';
import sampleVueVite from 'cppjs-sample-vue-vite/cppjs.config.js';
import sampleReactNative from 'cppjs-sample-reactnative/cppjs.config.mjs';

export default [
    libSampleBasic.paths.project,
    libSampleComplex.paths.project,
    sampleReactCra.paths.project,
    sampleVueVite.paths.project,
    sampleReactNative.paths.project,
];
