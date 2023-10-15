import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
	paths: {
        project: getDirName(import.meta.url),
	}
}
