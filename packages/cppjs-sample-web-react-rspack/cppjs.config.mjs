import getDirName from 'cpp.js/src/utils/getDirName.js';
import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-web-react-rspack',
    },
    dependencies: [
        Matrix,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
    },
};
