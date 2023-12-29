import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    export: {
        type: "cmake"
    },
	paths: {
        base: "../..",
        project: getDirName(import.meta.url),
        output: 'dist',
	}
}
