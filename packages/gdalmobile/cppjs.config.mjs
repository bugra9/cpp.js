import getDirName from 'cpp.js/src/utils/getDirName.js';
import Gdal from 'cppjs-package-gdal/cppjs.config.js';
// import Sqlite3 from 'cppjs-package-sqlite3/cppjs.config.js';

export default {
    dependencies: [
        Gdal,
        // Sqlite3,
    ],
	paths: {
        base: '../..',
        project: getDirName(import.meta.url),
	}
}
