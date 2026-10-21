import { afterEach, describe, expect, test, vi } from 'vitest';
import {
    app, dialog, events, shell, updater,
} from '../src/app/index.js';

// The host of an app, as page.js hands it the page's calls.
const host = vi.fn(async () => null);
const inApp = () => {
    globalThis.Crossbind = { app: host };
};

afterEach(() => {
    delete globalThis.Crossbind;
    delete globalThis.__crossbind_token;
    host.mockClear();
});

describe("crossbind/app, an app's own functions", () => {
    test('rejects outside an app, naming what makes one', async () => {
        await expect(app.paths()).rejects.toThrow("target.runtimeEnv: 'app'");
    });

    test('rejects in an app whose page has not called initNative() yet', async () => {
        globalThis.__crossbind_token = 'token';

        await expect(app.paths()).rejects.toThrow('initNative()');
    });

    test('rejects with a host older than crossbind/app, naming the package to update', async () => {
        globalThis.Crossbind = { initNative: () => {} };

        await expect(app.paths()).rejects.toThrow('update @crossbind/core-app-host');
    });

    test("goes to the app's host by name with its options", async () => {
        inApp();
        host.mockResolvedValueOnce(['/home/me/a.txt']);

        await expect(dialog.open({ multiple: true, filters: [{ name: 'Text', extensions: ['.txt', 'md'] }] })).resolves.toEqual(['/home/me/a.txt']);
        expect(host).toHaveBeenCalledWith('dialog.open', { multiple: true, filters: [{ name: 'Text', extensions: ['.txt', 'md'] }] });
        host.mockResolvedValueOnce('/home/me/b.csv');
        await expect(dialog.save({ defaultName: 'b.csv' })).resolves.toBe('/home/me/b.csv');
        expect(host).toHaveBeenLastCalledWith('dialog.save', { defaultName: 'b.csv' });
        await shell.openExternal(new URL('https://crossbind.dev/guide'));
        expect(host).toHaveBeenLastCalledWith('shell.openExternal', { url: 'https://crossbind.dev/guide' });
        await shell.openPath('/home/me/b.csv');
        expect(host).toHaveBeenLastCalledWith('shell.openPath', { path: '/home/me/b.csv' });
        await shell.revealInFolder('/home/me/a.txt');
        expect(host).toHaveBeenLastCalledWith('shell.revealInFolder', { path: '/home/me/a.txt' });
        const folders = { data: '/d', cache: '/c', logs: '/l' };
        host.mockResolvedValueOnce(folders);
        await expect(app.paths()).resolves.toEqual(folders);
        await app.quit();
        expect(host).toHaveBeenLastCalledWith('app.quit', {});
        host.mockResolvedValueOnce({ version: '1.3.0' });
        await expect(updater.check()).resolves.toEqual({ version: '1.3.0' });
        expect(host).toHaveBeenLastCalledWith('updater.check', {});
        await updater.install();
        expect(host).toHaveBeenLastCalledWith('updater.install', {});
    });

    test("hands a listener of the app's events to the host, which returns what stops it", () => {
        const off = () => {};
        globalThis.Crossbind = { on: vi.fn(() => off) };
        const listener = () => {};

        expect(events.on('progress', listener)).toBe(off);
        expect(globalThis.Crossbind.on).toHaveBeenCalledWith('progress', listener);
    });

    test('refuses a listener without a name or a function, and one outside an app or with an older host', () => {
        expect(() => events.on('', () => {})).toThrow('takes the name of an event');
        expect(() => events.on('progress', 'listener')).toThrow('takes a function to call');
        expect(() => events.on('progress', () => {})).toThrow("target.runtimeEnv: 'app'");
        inApp();
        expect(() => events.on('progress', () => {})).toThrow('update @crossbind/core-app-host to call events.on');
    });

    test('refuses an option it does not know or of another kind before the host sees it', async () => {
        inApp();

        await expect(dialog.save({ defualtName: 'a.csv' })).rejects.toThrow('defualtName is none of them');
        await expect(dialog.save({ toString: 'a.csv' })).rejects.toThrow('toString is none of them');
        await expect(dialog.open({ multiple: 'yes' })).rejects.toThrow('multiple is no boolean');
        await expect(dialog.open({ filters: [{ name: 'Text' }] })).rejects.toThrow('list of { name, extensions }');
        await expect(dialog.open('a.txt')).rejects.toThrow('takes an object');
        await expect(shell.openPath('')).rejects.toThrow('takes a path');
        await expect(shell.openExternal()).rejects.toThrow('takes an address');
        await expect(shell.openExternal(42)).rejects.toThrow('takes an address');
        expect(host).not.toHaveBeenCalled();
    });
});
