import {
    initNative, sqlite3_libversion,
} from '@crossbind/port-sqlite3/sqlite3.h';
import { Version, VersionReq } from 'cargo:semver';
import { pretty } from './native/native.h';

await initNative();

console.log('SQLite', sqlite3_libversion());

const wanted = VersionReq.parse('^1.2');
for (const text of ['1.1.0', '1.4.2', '2.0.0']) {
    console.log(text, wanted.matches(Version.parse(text)));
}

console.log(pretty('{"name":"crossbind","tags":["c++","rust"]}'));
