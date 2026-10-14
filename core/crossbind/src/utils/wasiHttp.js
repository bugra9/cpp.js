// The runtime of an http build: crossbind's wasi:http/handler export, which calls the app's
// crossbind::http::handle, and the bindings wit-bindgen generated for it (assets/wasi-runtime/http/README.md).

import fs from 'node:fs';
import path from 'node:path';

const RUNTIME = 'assets/wasi-runtime/http';
// The stack of each request: wasi-libc mallocs one per concurrent request, with no guard below it.
const STACK_SIZE = 1024 * 1024;
const HEADER = 'include/crossbind/http.h';
const LINKED = [
    'handler.cpp',
    'bindings/crossbind_http.c',
    'bindings/crossbind_http.h',
    'bindings/crossbind_http_component_type.o',
    HEADER,
];

// paths.cli can lie outside the docker mount, so the files are copied into the build tree first.
function stage(cliPath, dir, files) {
    files.forEach((file) => {
        fs.mkdirSync(path.dirname(`${dir}/${file}`), { recursive: true });
        fs.copyFileSync(`${cliPath}/${RUNTIME}/${file}`, `${dir}/${file}`);
    });
}

export const wasiHttpFiles = (cliPath) => LINKED.map((file) => `${cliPath}/${RUNTIME}/${file}`);

export const wasiHttpHeader = (cliPath) => `${cliPath}/${RUNTIME}/${HEADER}`;

// The include dir of a wasi source build, where the app's handler finds <crossbind/http.h>.
export function stageWasiHttpInclude(cliPath, dir) {
    stage(cliPath, dir, [HEADER]);
    return `${dir}/include`;
}

// What an http link adds to a command's: the handler export, its bindings (C, hence -x c) with the world
// they implement, the reactor model, which has no main, and a stack as large as the wasm builds'.
export function stageWasiHttpLink(cliPath, dir) {
    stage(cliPath, dir, LINKED);
    return [
        `-I${dir}/include`,
        `-I${dir}/bindings`,
        `${dir}/handler.cpp`,
        '-x', 'c', `${dir}/bindings/crossbind_http.c`, '-x', 'none',
        `${dir}/bindings/crossbind_http_component_type.o`,
        '-mexec-model=reactor',
        `-Wl,-z,stack-size=${STACK_SIZE}`,
    ];
}
