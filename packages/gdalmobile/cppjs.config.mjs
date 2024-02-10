import getDirName from 'cpp.js/src/utils/getDirName.js';
import Sqlite3 from 'cppjs-package-sqlite3/cppjs.config.js';

export default {
    dependencies: [
        Sqlite3,
    ],
	paths: {
        base: '../..',
        project: getDirName(import.meta.url),
	}
}
