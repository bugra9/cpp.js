import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { PNG } from 'pngjs';
import { androidIcons, iosIcon, linuxIcon, macIcon, readAppIcon, resize, windowsIcon } from '../src/utils/appIcon.js';

// A square image whose pixel at (x, y) is pixel(x, y), as RGBA.
function image(size, pixel) {
    const data = Buffer.alloc(size * size * 4);
    for (let i = 0; i < size * size; i++) data.set(pixel(i % size, Math.floor(i / size)), i * 4);
    return { width: size, height: size, data };
}

const pixels = ({ data }) => Array.from({ length: data.length / 4 }, (_, i) => Array.from(data.subarray(i * 4, i * 4 + 4)));
const decoded = (bytes) => PNG.sync.read(bytes);

const projects = [];
afterAll(() => projects.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

function project(files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-icon-'));
    projects.push(dir);
    Object.entries(files).forEach(([name, bytes]) => fs.writeFileSync(path.join(dir, name), bytes));
    return dir;
}

const config = (dir, app) => ({ app, paths: { project: dir } });

describe("an app's icon", () => {
    test('is none without app.icon', () => {
        expect(readAppIcon(config('/nowhere', {}))).toBeNull();
    });

    test('is the square PNG app.icon names, from the project', () => {
        const dir = project({ 'icon.png': PNG.sync.write(image(32, () => [1, 2, 3, 255])) });
        const icon = readAppIcon(config(dir, { icon: 'icon.png' }));
        expect(icon.file).toBe(path.join(dir, 'icon.png'));
        expect(icon.image).toMatchObject({ width: 32, height: 32 });
        expect(icon.hash).toMatch(/^[0-9a-f]{64}$/);
    });

    test('refuses what is no path, a file that is missing or no PNG, and an image that is not square', () => {
        const dir = project({ 'icon.txt': 'not an image', 'wide.png': PNG.sync.write({ width: 4, height: 2, data: Buffer.alloc(32) }) });
        expect(() => readAppIcon(config(dir, { icon: 7 }))).toThrow('app.icon 7 is no path to a PNG file');
        expect(() => readAppIcon(config(dir, { icon: 'missing.png' }))).toThrow('which does not exist');
        expect(() => readAppIcon(config(dir, { icon: 'icon.txt' }))).toThrow('is no PNG image');
        expect(() => readAppIcon(config(dir, { icon: 'wide.png' }))).toThrow('is 4 × 2 pixels; an app\'s icon is square');
    });
});

describe('resizing an icon', () => {
    test('keeps an image of one color that color, larger or smaller', () => {
        const blue = image(48, () => [10, 20, 200, 255]);
        [16, 100].forEach((size) => {
            const resized = resize(blue, size);
            expect(resized).toMatchObject({ width: size, height: size });
            expect(new Set(pixels(resized).map(String))).toEqual(new Set(['10,20,200,255']));
        });
    });

    test('keeps each corner where it was', () => {
        // Opaque in the top right quarter alone: halved, the image keeps it there. The corners are beyond the filter's
        // reach of the quarter's edges.
        const resized = resize(image(16, (x, y) => (x >= 8 && y < 8 ? [0, 0, 0, 255] : [0, 0, 0, 0])), 8);
        const alphaAt = (x, y) => resized.data[(y * 8 + x) * 4 + 3];
        expect([alphaAt(7, 0), alphaAt(0, 0), alphaAt(7, 7), alphaAt(0, 7)]).toEqual([255, 0, 0, 0]);
    });

    test('lets no color of a transparent pixel into its neighbors', () => {
        // Transparent red on the left, blue on the right: one pixel of it is blue, half transparent, never purple.
        const [red, green, blue, alpha] = resize(image(8, (x) => (x < 4 ? [255, 0, 0, 0] : [0, 0, 255, 255])), 1).data;
        expect([red, green, blue]).toEqual([0, 0, 255]);
        expect(Math.abs(alpha - 128)).toBeLessThanOrEqual(1);
    });
});

describe('the icon files of each platform', () => {
    const icon = { image: image(64, (x, y) => [x * 4, y * 4, 128, x < 8 ? 0 : 255]) };

    test('a macOS .icns holds each of its sizes as a PNG', () => {
        const icns = macIcon(icon);
        expect(icns.toString('latin1', 0, 4)).toBe('icns');
        expect(icns.readUInt32BE(4)).toBe(icns.length);
        const entries = [];
        for (let at = 8; at < icns.length; at += icns.readUInt32BE(at + 4)) {
            entries.push([icns.toString('latin1', at, at + 4), decoded(icns.subarray(at + 8, at + icns.readUInt32BE(at + 4))).width]);
        }
        expect(entries).toEqual([['icp4', 16], ['icp5', 32], ['ic11', 32], ['ic12', 64], ['ic07', 128], ['ic13', 256], ['ic08', 256],
            ['ic14', 512], ['ic09', 512], ['ic10', 1024]]);
    });

    test('a Windows .ico holds six PNGs, its directory naming 256 as 0', () => {
        const ico = windowsIcon(icon);
        expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 6]);
        const entries = Array.from({ length: 6 }, (_, index) => {
            const at = 6 + 16 * index;
            const bytes = ico.subarray(ico.readUInt32LE(at + 12), ico.readUInt32LE(at + 12) + ico.readUInt32LE(at + 8));
            return [ico[at], ico.readUInt16LE(at + 6), decoded(bytes).width];
        });
        expect(entries).toEqual([[16, 32, 16], [24, 32, 24], [32, 32, 32], [48, 32, 48], [64, 32, 64], [0, 32, 256]]);
    });

    test('an iOS icon is 1024, without an alpha channel, and white where the icon is transparent', () => {
        const ios = decoded(iosIcon(icon));
        expect(ios).toMatchObject({ width: 1024, height: 1024, colorType: 2 });
        expect(pixels(ios).every(([, , , alpha]) => alpha === 255)).toBe(true);
        expect(pixels(ios)[0]).toEqual([255, 255, 255, 255]);
    });

    test("an Android icon's foregrounds hold the whole icon in the middle 72 of 108 dp", () => {
        const icons = androidIcons(icon);
        expect(Object.keys(icons)).toEqual(['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'].map((density) => `mipmap-${density}/ic_launcher_foreground.png`));
        const mdpi = decoded(icons['mipmap-mdpi/ic_launcher_foreground.png']);
        expect(mdpi).toMatchObject({ width: 108, height: 108 });
        const at = (x, y) => pixels(mdpi)[y * 108 + x];
        // The 72 px icon starts at 18: the margin is transparent, the icon's opaque right edge is in.
        expect(at(17, 54)[3]).toBe(0);
        expect(at(88, 54)[3]).toBe(255);
        expect(at(90, 54)[3]).toBe(0);
        expect(decoded(icons['mipmap-xxxhdpi/ic_launcher_foreground.png']).width).toBe(432);
    });

    test('a Linux window icon is 512', () => {
        expect(decoded(linuxIcon(icon))).toMatchObject({ width: 512, height: 512 });
    });
});
