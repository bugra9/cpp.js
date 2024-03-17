import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    general: {
        name: 'webp',
    },
    export: {
        type: 'cmake',
        libName: ['libwebp.a', 'libsharpyuv.a'],
    },
    paths: {
        base: '.',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
