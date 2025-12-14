export default {
    general: {
        name: 'z',
    },
    export: {
        type: 'cmake',
    },
    build: {
        usePthread: true,
    },
    paths: {
        config: import.meta.url,
        output: 'dist',
    },
};
