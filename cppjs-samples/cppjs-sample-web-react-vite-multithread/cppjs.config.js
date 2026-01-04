import matrix from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-web-react-vite-multithread',
    },
    dependencies: [
        matrix,
    ],
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-cpp.js */
    },
    build: {
        usePthread: true
    }
};

