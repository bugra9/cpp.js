import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    export: {
        type: "cmake"
    },
	paths: {
        project: getDirName(import.meta.url),
        output: "."
	}
}
