import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    dependencies: [
        Matrix,
    ],
	paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
	}
}