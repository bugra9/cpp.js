import { describe, expect, test } from 'vitest';
import fs from 'node:fs';

const entries = fs.readFileSync(new URL('../src/assets/webkitgtk-sysroot.txt', import.meta.url), 'utf8')
    .split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => line.split(' '));

describe('the WebKitGTK sysroot list', () => {
    test('pins every package of both arches by its file and sha256', () => {
        expect(entries.length).toBeGreaterThan(0);
        for (const [arch, file, sha256, ...rest] of entries) {
            expect(['amd64', 'arm64']).toContain(arch);
            expect(file).toMatch(new RegExp(`_(${arch}|all)\\.deb$`));
            expect(sha256).toMatch(/^[0-9a-f]{64}$/);
            expect(rest).toEqual([]);
        }
    });

    test('lists the same packages for both arches, WebKitGTK among them', () => {
        const packagesOf = (arch) => entries.filter(([debianArch]) => debianArch === arch).map(([, file]) => file.split('_')[0]).sort();

        expect(packagesOf('arm64')).toEqual(packagesOf('amd64'));
        expect(packagesOf('amd64')).toContain('libwebkit2gtk-4.1-dev');
    });
});
