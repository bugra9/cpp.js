import getDirName from 'cpp.js/src/utils/getDirName.js';
import Gdal from 'cppjs-package-gdal/cppjs.config.js';

export default {
    dependencies: [
        Gdal,
    ],
    paths: {
        base: '../..',
        project: getDirName(import.meta.url),
        native: ['src/native'],
    },
    general: {
        name: 'cppjs-package-gdal3js',
    },
};
