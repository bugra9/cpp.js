import Matrix from '@crossbind/example-lib-prebuilt-matrix/crossbind.config.js';

export default {
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
    },
};
