import { initNative, greet } from './native/greet.h';
import { fibonacci } from './native/math.rs';
import {
    sqlite3_libversion,
} from '@crossbind/port-sqlite3/sqlite3.h';
import { Uuid } from 'cargo:uuid';
import { zlibVersion } from 'conan:zlib/zlib.h';

await initNative();

const id = await Uuid.newV4();

console.log(await greet('crossbind'), await fibonacci(90));
console.log(await sqlite3_libversion());
console.log(await id.toString(), await zlibVersion());
