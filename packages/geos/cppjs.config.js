import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    general: {
        name: 'geos',
    },
    export: {
        type: 'cmake',
    },
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        output: 'dist',
    },
};
