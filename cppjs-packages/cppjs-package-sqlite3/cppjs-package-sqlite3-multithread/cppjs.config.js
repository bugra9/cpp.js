import sqlite3WasmMultithread from '@cpp.js/package-sqlite3-wasm-multithread/cppjs.config.js';
import sqlite3AndroidMultithread from '@cpp.js/package-sqlite3-android-multithread/cppjs.config.js';
import sqlite3IOSMultithread from '@cpp.js/package-sqlite3-ios-multithread/cppjs.config.js';

export default {
    dependencies: [
        sqlite3WasmMultithread,
        sqlite3AndroidMultithread,
        sqlite3IOSMultithread
    ],
    paths: {
        config: import.meta.url,
    },
};
