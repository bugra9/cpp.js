import { describe, test, expect } from 'vitest';
import getParentPath from '../src/utils/getParentPath.js';

describe('getParentPath', () => {
    test('strips the file segment from a file:// URL', () => {
        const input = 'file:///Users/me/project/cppjs-core/cpp.js/src/index.js';
        expect(getParentPath(input)).toBe('/Users/me/project/cppjs-core/cpp.js/src');
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
