import getDirName from 'cpp.js/src/utils/getDirName.js';
import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    dependencies: [
        Matrix,
    ],
	paths: {
        project: getDirName(import.meta.url),
	}
}
