import sqlite3Wasm from '@crossbind/port-sqlite3-wasm/crossbind.config.js';

// No C++ in this project: every binding comes from the port headers the JavaScript imports.
export default {
    general: { name: 'sqlite3direct' },
    dependencies: [sqlite3Wasm],
    paths: { config: import.meta.url },
};
