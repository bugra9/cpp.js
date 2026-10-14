import { CREATE_COMMAND, REPO_URL } from '../../data.js';
import { RELEASE } from '../../release.js';

const suffix = RELEASE.distTagSuffix;

export default {
    slug: 'electron',
    title: 'Electron',
    description: 'Load a Node-API addon in Electron\'s main process, call it from the window, and package the app.',
    lede: 'Electron\'s main process is Node.js, so it loads the same Node-API addon crossbind builds for [Node.js](/guide/node/#addon). The window has no Node.js: a preload script exposes the calls it needs, and the main process answers them over IPC.',
    blocks: [
        { type: 'h2', id: 'setup', text: 'Setup' },
        { type: 'p', text: 'Start from the template:' },
        { type: 'code', file: 'shell', code: `${CREATE_COMMAND} my-app Desktop Electron` },
        { type: 'p', text: 'Or, in an existing app, add this config and build the addon:' },
        {
            type: 'code',
            file: 'crossbind.config.js',
            code: `export default {
    general: { name: 'my-app' },
    paths: {
        config: import.meta.url,
        output: 'dist',
    },
};`,
        },
        {
            type: 'code',
            file: 'shell',
            code: `npm install -D crossbind${suffix} @crossbind/core-embind-napi${suffix}
npx crossbind build -p host -e node -b release`,
        },
        {
            type: 'p',
            text: 'C++ goes in `src/native`. The build writes this machine\'s addons, one per architecture, as `dist/my-app.<platform>-<arch>.node`, and the loader `dist/my-app.native.cjs`, which picks one at run time. `-p darwin,linux,win32` builds all three desktop platforms.',
        },

        { type: 'h2', id: 'addon', text: 'The addon in the main process' },
        { type: 'p', text: 'Load the addon in the main process and answer the window over IPC:' },
        {
            type: 'code',
            file: 'src/main.js',
            code: `const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const initNative = require('../dist/my-app.native.cjs');

ipcMain.handle('native:sample', async () => {
    const { Native } = await initNative();
    return Native.sample();
});

app.whenReady().then(() => {
    const window = new BrowserWindow({
        webPreferences: { preload: path.join(__dirname, 'preload.js') },
    });
    window.loadFile(path.join(__dirname, 'index.html'));
});`,
        },
        {
            type: 'code',
            file: 'src/preload.js',
            code: `const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('native', {
    sample: () => ipcRenderer.invoke('native:sample'),
});`,
        },
        {
            type: 'p',
            text: 'The page calls `await window.native.sample()` and keeps Electron\'s sandbox. A prebuilt port works the same way: install its `-standalone-napi` package and import it in the main process, as on [Node.js](/guide/node/#addon).',
        },
        {
            type: 'p',
            text: 'Nothing is rebuilt per Electron version. Node-API is ABI-stable, so the addon Node.js loads also loads in Electron, and `electron-rebuild` has nothing to do; a Windows addon looks Node-API up in the process that loads it, so `node.exe` and `electron.exe` load the same file. Values cross the boundary already converted, so JavaScript never holds an `ArrayBuffer` over native memory, which Electron\'s V8 memory cage refuses.',
        },

        { type: 'h2', id: 'packaging', text: 'Packaging' },
        {
            type: 'p',
            text: 'A packaged app keeps crossbind\'s output outside its asar archive. Electron loads an addon from there as it is, and a library\'s native code reads its data, such as `proj.db`, with file APIs that cannot open a file inside the archive; in a packaged app the loader reads the data from `app.asar.unpacked`. With electron-builder:',
        },
        {
            type: 'code',
            file: 'electron-builder.yml',
            code: `directories:
  output: out
files:
  - src/**
  - dist/**
  - '!dist/prebuilt'
asarUnpack:
  - dist/**`,
        },
        {
            type: 'p',
            text: '`directories.output` moves electron-builder\'s own output out of `dist`, its default, where crossbind writes; `dist/prebuilt` holds the static archives the addon was linked from, which the app does not need. `electron-builder --dir` writes the app to `out/`, and `electron-builder` alone makes the installers. Package each platform with its addons in `dist`: the loader picks the one for the machine it runs on.',
        },
        {
            type: 'p',
            text: 'A `-standalone-napi` port keeps its data in its own `dist/data`, so unpack `node_modules/@crossbind/**` as well. Electron Forge takes `packagerConfig.asar.unpackDir: \'dist\'`, and under pnpm it also wants `node-linker=hoisted`.',
        },

        { type: 'h2', id: 'limits', text: 'Limits' },
        {
            type: 'ul',
            items: [
                '**macOS addons build only on a Mac** with Xcode\'s command line tools. Linux and Windows addons build in Docker on any host, a Mac included.',
                '**One Node environment per process.** The addon cannot load again in a `worker_threads` worker of the main process; `initNative()` there rejects with an error.',
            ],
        },
        {
            type: 'p',
            text: `[examples/desktop-electron](${REPO_URL}/tree/main/examples/desktop-electron) is a complete app: the addon in the main process, the preload, electron-builder packaging and a Playwright test that opens the app from its sources and packaged. CI runs it with Electron 44 on macOS, Linux and Windows.`,
        },
    ],
};
