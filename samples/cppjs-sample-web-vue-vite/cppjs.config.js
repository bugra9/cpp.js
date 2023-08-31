import getDirName from 'cpp.js/src/utils/getDirName.js';
import SimpleComplex from 'cppjs-lib-samplecomplex-wasm/cppjs.config.js';

export default {
    export: {
        header: "include",
        libPath: "lib",
        libName: ["cppjs-lib-samplecomplex"],
    },
    dependencies: [
        SimpleComplex,
    ],
	paths: {
		base: "../..",
        project: getDirName(import.meta.url),
        native: ["native"]
	}
}
