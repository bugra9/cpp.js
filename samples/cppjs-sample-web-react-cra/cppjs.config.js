import getDirName from 'cpp.js/src/utils/getDirName.js';
import SimpleComplex from 'cppjs-lib-samplecomplex-wasm/cppjs.config.js';

export default {
    dependencies: [
        SimpleComplex,
    ],
	paths: {
		base: "../..",
        project: getDirName(import.meta.url),
	}
}
