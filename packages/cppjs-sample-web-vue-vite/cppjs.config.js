import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    general: {
        name: 'cppjs-sample-web-vue-vite',
    },
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
        base: '../..',
    },
};
