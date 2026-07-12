import { describe, it, expect } from 'vitest';
import { buildLinkLibArgs, libNameOf } from '../src/utils/linkLayout.js';

const W = '-Wl,--whole-archive';
const N = '-Wl,--no-whole-archive';

const deps = ['/p/libproj.a', '/p/libgdal.a'];
const source = '/p/libapp.a';
const bridge = '/p/Bridge/libapp.a';
const libs = [...deps, source, bridge];

describe('libNameOf', () => {
    it('strips the lib prefix and .a suffix', () => {
        expect(libNameOf('/x/y/libgdal.a')).toBe('gdal');
        expect(libNameOf('/x/libLerc.a')).toBe('Lerc');
    });

    it('leaves non-conventional names untouched', () => {
        expect(libNameOf('/x/liberty.a')).toBe('erty');
        expect(libNameOf('/x/gdal.a')).toBe('gdal.a');
    });
});

describe('buildLinkLibArgs', () => {
    it('wraps only the bridge by default so dead code elimination applies', () => {
        expect(buildLinkLibArgs(libs, {})).toEqual([
            ...deps, source, W, bridge, N,
        ]);
    });

    it('wholeArchiveAll restores the legacy layout with one wrap', () => {
        expect(buildLinkLibArgs(libs, { wholeArchiveAll: true })).toEqual([
            W, ...deps, source, bridge, N,
        ]);
    });

    it('wraps a dependency named in wholeArchiveNames', () => {
        expect(buildLinkLibArgs(libs, { wholeArchiveNames: new Set(['proj']) })).toEqual([
            W, '/p/libproj.a', N, '/p/libgdal.a', source, W, bridge, N,
        ]);
    });

    it('merges adjacent wrapped archives without redundant toggles', () => {
        expect(buildLinkLibArgs(libs, { wholeArchiveNames: new Set(['gdal']) })).toEqual([
            '/p/libproj.a', W, '/p/libgdal.a', N, source, W, bridge, N,
        ]);
    });

    it('handles a bridge-only lib list', () => {
        expect(buildLinkLibArgs([bridge], {})).toEqual([W, bridge, N]);
    });
});
