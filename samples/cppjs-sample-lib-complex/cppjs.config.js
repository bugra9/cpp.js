import getDirName from 'cpp.js/src/utils/getDirName.js';
import SimpleBasic from 'cppjs-lib-samplebasic-wasm/cppjs.config.js';
import SimpleBasicCMake from 'cppjs-lib-samplebasiccmake-wasm/cppjs.config.js';
import SimpleBasicPrebuilt from 'cppjs-lib-samplebasicprebuilt-wasm/cppjs.config.js';

export default {
    export: {
        header: "include",
        libPath: "lib",
        libName: ["cppjs-lib-samplecomplex"],
    },
    dependencies: [
        SimpleBasic,
        SimpleBasicCMake,
        SimpleBasicPrebuilt,
    ],
	paths: {
		base: "../..",
        project: getDirName(import.meta.url),
		output: "dist"
	}
}
