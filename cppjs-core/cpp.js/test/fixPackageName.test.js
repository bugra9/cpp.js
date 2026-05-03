import { describe, test, expect } from 'vitest';
import fixPackageName from '../src/utils/fixPackageName.js';

describe('fixPackageName', () => {
    test('returns null for null input', () => {
        expect(fixPackageName(null)).toBeNull();
    });

    test('returns null for empty string', () => {
        expect(fixPackageName('')).toBeNull();
    });

    test('strips scope characters from a scoped npm name', () => {
        expect(fixPackageName('@cpp.js/package-zlib')).toBe('cppjspackage-zlib');
    });

    test('strips spaces and punctuation, keeps hyphens and underscores', () => {
        expect(fixPackageName('pkg name with spaces!')).toBe('pkgnamewithspaces');
    });

    test('preserves alphanumerics, hyphens, and underscores verbatim', () => {
        expect(fixPackageName('Foo_Bar-123')).toBe('Foo_Bar-123');
    });

    test('collapses runs of disallowed characters into nothing', () => {
        expect(fixPackageName('a..b//c')).toBe('abc');
    });
});
