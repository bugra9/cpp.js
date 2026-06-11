import { describe, test, expect } from 'vitest';
import { isCopyleft, validateSpdx, formatNoticesMarkdown } from '../src/utils/licenseReport.js';

describe('validateSpdx', () => {
    test.each([
        'MIT',
        'LGPL-2.1-or-later',
        'curl',
        'libtiff',
        'blessing',
        '(IJG AND BSD-3-Clause AND Zlib)',
        'MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later',
    ])('accepts valid SPDX "%s"', (expression) => {
        expect(validateSpdx(expression).isValid).toBe(true);
    });

    test.each(['LGPL', 'Public Domain', 'MPL tri-license', ''])('rejects invalid "%s"', (expression) => {
        expect(validateSpdx(expression).isValid).toBe(false);
    });

    test('reports a missing field', () => {
        const result = validateSpdx(undefined);

        expect(result.isValid).toBe(false);
        expect(result.error).toMatch(/missing/i);
    });
});

describe('isCopyleft', () => {
    test.each(['LGPL-2.1-or-later', 'GPL-3.0-only', 'MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later', 'EPL-2.0'])(
        'flags %s',
        (expression) => expect(isCopyleft(expression)).toBe(true),
    );

    test.each(['MIT', 'Apache-2.0', 'Zlib', 'blessing', 'BSD-3-Clause', undefined])(
        'does not flag %s',
        (expression) => expect(isCopyleft(expression)).toBe(false),
    );
});

describe('formatNoticesMarkdown', () => {
    const row = (overrides = {}) => ({
        name: 'z',
        npmName: '@cpp.js/package-zlib-wasm',
        version: '2.0.0',
        nativeVersion: '1.3.2',
        license: 'Zlib',
        sourceUrl: 'https://zlib.net/zlib-1.3.2.tar.gz',
        licenseText: 'zlib License text here',
        isCopyleft: false,
        ...overrides,
    });

    test('renders a section per dependency, sorted by name, with metadata', () => {
        const markdown = formatNoticesMarkdown([row({ name: 'z' }), row({ name: 'geos', license: 'LGPL-2.1-or-later', isCopyleft: true })]);

        expect(markdown.indexOf('## geos')).toBeLessThan(markdown.indexOf('## z'));
        expect(markdown).toContain('LGPL-2.1-or-later');
        expect(markdown).toContain('@cpp.js/package-zlib-wasm@2.0.0');
        expect(markdown).toContain('native version: 1.3.2');
        expect(markdown).toContain('https://zlib.net/zlib-1.3.2.tar.gz');
        expect(markdown).toContain('zlib License text here');
    });

    test('tolerates missing fields', () => {
        const markdown = formatNoticesMarkdown([row({ license: null, sourceUrl: null, licenseText: null, nativeVersion: null })]);

        expect(markdown).toContain('## z');
        expect(markdown).not.toContain('null');
    });
});
