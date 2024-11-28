/* eslint-disable import/no-anonymous-default-export */
import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    general: {
        name: "cppjs-sample-web-react-cra"
    },
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
        base: "../..",
    }
}
