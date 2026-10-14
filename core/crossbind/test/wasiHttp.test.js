import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { stageWasiHttpInclude, stageWasiHttpLink, wasiHttpFiles } from '../src/utils/wasiHttp.js';

const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

describe('wasi http runtime', () => {
    let work;

    beforeEach(() => {
        work = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-wasi-http-'));
    });

    afterEach(() => {
        fs.rmSync(work, { recursive: true, force: true });
    });

    test('ships every file an http link needs', () => {
        for (const file of wasiHttpFiles(cli)) {
            expect(fs.existsSync(file), file).toBe(true);
        }
    });

    test('the link compiles the handler as C++ and the generated bindings as C, into a reactor with a 1 MiB stack', () => {
        const dir = `${work}/http`;
        expect(stageWasiHttpLink(cli, dir)).toEqual([
            `-I${dir}/include`,
            `-I${dir}/bindings`,
            `${dir}/handler.cpp`,
            '-x', 'c', `${dir}/bindings/crossbind_http.c`, '-x', 'none',
            `${dir}/bindings/crossbind_http_component_type.o`,
            '-mexec-model=reactor',
            '-Wl,-z,stack-size=1048576',
        ]);
        for (const file of wasiHttpFiles(cli)) {
            const staged = `${dir}/${path.relative(`${cli}/assets/wasi-runtime/http`, file)}`;
            expect(fs.readFileSync(staged)).toEqual(fs.readFileSync(file));
        }
    });

    test('a source build gets the header alone, under an include dir', () => {
        const include = stageWasiHttpInclude(cli, `${work}/http`);
        expect(include).toBe(`${work}/http/include`);
        expect(fs.readdirSync(`${work}/http`)).toEqual(['include']);
        expect(fs.existsSync(`${include}/crossbind/http.h`)).toBe(true);
    });
});
