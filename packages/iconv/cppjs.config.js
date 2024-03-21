import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    general: {
        name: 'iconv',
    },
    export: {
        type: 'cmake',
        libName: ['iconv', 'charset'],
    },
    paths: {
        base: '.',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
    platform: {
        'Emscripten-x86_64': {
            ignoreLibName: ['charset'],
        },
    },
};
