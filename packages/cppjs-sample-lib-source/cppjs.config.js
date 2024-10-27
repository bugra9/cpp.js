import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    export: {
        type: 'source',
    },
    paths: {
        project: getDirName(import.meta.url),
    },
};
