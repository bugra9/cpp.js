import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    general: {
        name: 'cppjs-sample-cloud-cloudflare-worker',
    },
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
