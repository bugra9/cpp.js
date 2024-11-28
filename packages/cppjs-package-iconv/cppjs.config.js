export default {
    general: {
        name: 'iconv',
    },
    export: {
        type: 'cmake',
        libName: ['iconv', 'charset'],
    },
    paths: {
        config: import.meta.url,
        output: 'dist',
    },
    platform: {
        'Emscripten-x86_64': {
            ignoreLibName: ['charset'],
        },
    },
};
