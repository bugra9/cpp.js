import getDirName from 'cpp.js/src/utils/getDirName.js';
import Matrix from 'cppjs-sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    dependencies: [
        Matrix,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
    },
};
