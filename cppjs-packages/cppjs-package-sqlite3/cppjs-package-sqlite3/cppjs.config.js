import sqlite3Wasm from '@cpp.js/package-sqlite3-wasm/cppjs.config.js';
import sqlite3Android from '@cpp.js/package-sqlite3-android/cppjs.config.js';
import sqlite3IOS from '@cpp.js/package-sqlite3-ios/cppjs.config.js';

export default {
    dependencies: [
        sqlite3Wasm,
        sqlite3Android,
        sqlite3IOS
    ],
    paths: {
        config: import.meta.url,
    },
};
