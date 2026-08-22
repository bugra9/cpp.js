import { describe, test, expect } from 'vitest';
import upath from 'upath';
import getAbsolutePath from '../src/utils/getAbsolutePath.js';

describe('getAbsolutePath', () => {
    test('returns null for null path', () => {
        expect(getAbsolutePath('/some/project', null)).toBeNull();
    });

    test('returns null for undefined path', () => {
        expect(getAbsolutePath('/some/project', undefined)).toBeNull();
    });

    // upath.resolve anchors POSIX-style absolutes to the current drive on Windows,
    // so expectations resolve the same way instead of hardcoding the POSIX literal.
    test('returns the path as-is when it is already absolute', () => {
        expect(getAbsolutePath('/some/project', '/etc/foo')).toBe(upath.resolve('/etc/foo'));
    });

    test('joins relative path against the projectPath when projectPath is provided', () => {
        expect(getAbsolutePath('/some/project', 'src/native')).toBe(upath.resolve('/some/project/src/native'));
    });

    test('resolves relative path against cwd when projectPath is missing', () => {
        const expected = upath.resolve('relative/path');
        expect(getAbsolutePath(null, 'relative/path')).toBe(expected);
    });

    test('normalizes ../ in relative paths against the projectPath', () => {
        expect(getAbsolutePath('/some/project/sub', '../sibling')).toBe(upath.resolve('/some/project/sibling'));
    });
});
