import Matrix from '@crossbind/example-lib-prebuilt-matrix/crossbind.config.js';

export default {
    general: {
        name: 'crossbind-example-desktop-app',
    },
    dependencies: [
        Matrix,
    ],
    // The page runs in the system webview and the C++ in the app's own process.
    target: {
        runtimeEnv: 'app',
    },
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-crossbind */
    },
};
