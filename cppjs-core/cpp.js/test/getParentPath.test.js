import { describe, test, expect } from 'vitest';
import { pathToFileURL } from 'node:url';
import upath from 'upath';
import getParentPath from '../src/utils/getParentPath.js';

describe('getParentPath', () => {
    // Built with pathToFileURL so the URL is valid on Windows too (drive letter);
    // a hardcoded POSIX file:// URL is rejected by fileURLToPath there.
    test('strips the file segment from a file:// URL', () => {
        const input = pathToFileURL(upath.resolve('/Users/me/project/cppjs-core/cpp.js/src/index.js')).href;
        expect(getParentPath(input)).toBe(upath.resolve('/Users/me/project/cppjs-core/cpp.js/src'));
    });

    test('strips the file segment from a plain absolute path', () => {
        expect(getParentPath('/foo/bar/baz.js')).toBe('/foo/bar');
    });

    test('normalizes Windows-style backslashes via upath', () => {
        expect(getParentPath('C:\\foo\\bar\\baz.js')).toBe('C:/foo/bar');
    });

    test('returns empty string when given a top-level filename', () => {
        expect(getParentPath('index.js')).toBe('');
    });

    test('handles trailing slashes by treating the last segment as the file', () => {
        expect(getParentPath('/foo/bar/')).toBe('/foo/bar');
    });
});
