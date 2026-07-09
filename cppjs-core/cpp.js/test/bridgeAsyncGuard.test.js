import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, test, expect } from 'vitest';
import guardAsyncBindings from '../src/utils/bridgeAsyncGuard.js';
import { getFilesFingerprint } from '../src/utils/hash.js';

describe('guardAsyncBindings', () => {
    test('wraps a chained async registration in #ifdef CPPJS_JSPI', () => {
        const input = [
            'emscripten::class_<Native>("Native")',
            '    .class_function("sample", &Native::sample)',
            '    .class_function("ops_JSPI", &Native::ops_JSPI, emscripten::async())',
            '    .class_function("runOnThread", &Native::runOnThread)',
            '    ;',
        ].join('\n');

        const output = guardAsyncBindings(input);

        expect(output).toContain([
            '#ifdef CPPJS_JSPI',
            '    .class_function("ops_JSPI", &Native::ops_JSPI, emscripten::async())',
            '#endif',
        ].join('\n'));
        expect(output).toContain('.class_function("sample", &Native::sample)');
    });

    test('keeps the statement valid when the async line closes the chain', () => {
        const input = [
            'emscripten::class_<Native>("Native")',
            '    .class_function("ops_JSPI", &Native::ops_JSPI, emscripten::async());',
        ].join('\n');

        const output = guardAsyncBindings(input);

        expect(output).toBe([
            'emscripten::class_<Native>("Native")',
            '#ifdef CPPJS_JSPI',
            '    .class_function("ops_JSPI", &Native::ops_JSPI, emscripten::async())',
            '#endif',
            '    ;',
        ].join('\n'));
    });

    test('wraps a standalone free-function registration', () => {
        const input = 'emscripten::function("fetch_JSPI", &fetch_JSPI, emscripten::async());';

        const output = guardAsyncBindings(input);

        expect(output).toBe([
            '#ifdef CPPJS_JSPI',
            'emscripten::function("fetch_JSPI", &fetch_JSPI, emscripten::async())',
            '#endif',
            ';',
        ].join('\n'));
    });

    test('is idempotent', () => {
        const input = [
            '    .class_function("a_JSPI", &N::a_JSPI, emscripten::async())',
            '    .class_function("b", &N::b);',
        ].join('\n');

        const once = guardAsyncBindings(input);
        const twice = guardAsyncBindings(once);

        expect(twice).toBe(once);
    });

    test('leaves bridges without async registrations untouched (same reference)', () => {
        const input = 'emscripten::class_<X>("X").class_function("a", &X::a);';
        expect(guardAsyncBindings(input)).toBe(input);
    });
});

describe('getFilesFingerprint', () => {
    test('is order-insensitive and content-sensitive', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-fp-'));
        const a = path.join(dir, 'a.cpp');
        const b = path.join(dir, 'b.cpp');
        fs.writeFileSync(a, 'AAA');
        fs.writeFileSync(b, 'BBB');

        const forward = getFilesFingerprint([a, b]);
        const backward = getFilesFingerprint([b, a]);
        expect(backward).toBe(forward);

        fs.writeFileSync(b, 'CHANGED');
        expect(getFilesFingerprint([a, b])).not.toBe(forward);

        fs.rmSync(dir, { recursive: true, force: true });
    });

    test('a grown file list changes the fingerprint (bridgeless-cache poisoning guard)', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-fp-'));
        const common = path.join(dir, 'commonBridges.cpp');
        const bridge = path.join(dir, 'native.i.cpp');
        fs.writeFileSync(common, 'COMMON');
        fs.writeFileSync(bridge, 'BRIDGE');

        expect(getFilesFingerprint([common, bridge])).not.toBe(getFilesFingerprint([common]));

        fs.rmSync(dir, { recursive: true, force: true });
    });

    test('missing files fingerprint deterministically instead of throwing', () => {
        const ghost = path.join(os.tmpdir(), 'cppjs-fp-missing', 'ghost.cpp');
        expect(getFilesFingerprint([ghost])).toBe(getFilesFingerprint([ghost]));
    });
});
