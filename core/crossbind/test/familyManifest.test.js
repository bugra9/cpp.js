import {
    describe, test, expect, beforeAll, afterAll,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import familyManifestOf from '../src/utils/familyManifest.js';

// A variant package resolving its family through node_modules, the layout the engine sees.
let work;
let variantDir;

beforeAll(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-family-manifest-'));
    variantDir = path.join(work, 'demo-wasi');
    const familyDir = path.join(variantDir, 'node_modules/@demo/family');
    fs.mkdirSync(familyDir, { recursive: true });
    fs.writeFileSync(path.join(variantDir, 'package.json'), JSON.stringify({ name: '@demo/family-wasi' }));
    fs.writeFileSync(path.join(familyDir, 'package.json'), JSON.stringify({
        name: '@demo/family', version: '1.2.3', nativeVersion: '9.9.9',
    }));
});

afterAll(() => {
    fs.rmSync(work, { recursive: true, force: true });
});

describe('familyManifestOf', () => {
    test('resolves the family manifest and its directory', () => {
        const family = familyManifestOf({
            general: { alias: { package: '@demo/family' } },
            paths: { project: variantDir },
        });
        expect(family.manifest.name).toBe('@demo/family');
        expect(family.manifest.version).toBe('1.2.3');
        // macOS tmpdir is a symlink (/var -> /private/var); compare the resolved paths.
        expect(fs.realpathSync(family.dir)).toBe(fs.realpathSync(path.join(variantDir, 'node_modules/@demo/family')));
    });

    test('returns null when the node declares no family alias', () => {
        expect(familyManifestOf({ paths: { project: variantDir } })).toBeNull();
    });

    test('returns null when the node has no project path', () => {
        expect(familyManifestOf({ general: { alias: { package: '@demo/family' } } })).toBeNull();
    });

    test('returns null when the family package is not installed', () => {
        expect(familyManifestOf({
            general: { alias: { package: '@demo/absent' } },
            paths: { project: variantDir },
        })).toBeNull();
    });
});
