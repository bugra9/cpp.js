export default {
    slug: 'filesystem',
    title: 'Filesystem',
    description: 'Where files live per runtime: OPFS, in-memory, the host disk - and how to mount user files.',
    lede: 'C++ wants paths. What a path means depends on where the module runs: real disk in Node, an origin-private store or plain memory in the browser, per-invocation memory on the edge. This page maps every combination, including how a file from an `<input>` element becomes a path your C++ can open.',
    blocks: [
        { type: 'h2', id: 'roots', text: 'The two browser roots' },
        {
            type: 'table',
            head: ['Mount', 'Backed by', 'Survives a reload', 'Available when'],
            rows: [
                ['`/opfs/<app>/`', 'the Origin Private File System', 'yes', '`useWorker: true`, `fs.opfs` not disabled, browser support'],
                ['`/memfs/<app>/`', 'in-memory', 'no - tab session only', 'always'],
            ],
        },
        {
            type: 'p',
            text: '`<app>` is `general.name` from `crossbind.config.js`. OPFS is a Worker-scope-only API, which is the single most important consequence on this page:',
        },
        {
            type: 'callout',
            tone: 'warn',
            title: 'OPFS requires useWorker: true',
            text: 'Mounting `/opfs/...` from the main thread throws. If the browser has no OPFS support - or the backend is blocked - the path is redirected to `/memfs/` and the reason is logged, so writes keep working but stop persisting.',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `const m = await initNative({
    useWorker: true,      // mandatory for OPFS
    fs: { opfs: true },   // the browser default, shown for clarity
});

// Anything under /opfs/<app>/ is still there after a reload.
m.FS.writeFile('/opfs/myapp/data.bin', new Uint8Array([1, 2, 3]));`,
        },

        { type: 'h2', id: 'helpers', text: 'Module helpers' },
        {
            type: 'table',
            head: ['Helper', 'Does'],
            rows: [
                ['`m.FS`', 'the standard virtual filesystem: `mkdirTree`, `writeFile`, `readFile`, …'],
                ['`m.getDefaultPath()`', 'returns `/opfs` or `/memfs` for the current configuration'],
                ['`m.getFinalPath(path)`', 'validates a path, falling back when OPFS is unavailable'],
                ['`m.getRandomPath(startPath?)`', 'creates `<start>/<app>/automounted/<random>` and returns it'],
                ['`m.autoMountFiles(files, parentPath?)`', 'streams `File[]` into the filesystem, returns the mounted paths'],
                ['`m.getFileBytes(path)`', 'file contents as a `Uint8Array`'],
                ['`m.getFileList(startPath?)`', 'recursive listing as `[{ path, size }]`'],
            ],
        },
        {
            type: 'code',
            file: 'JavaScript',
            code: `m.FS.mkdirTree('/memfs/myapp/cache');
m.FS.writeFile('/memfs/myapp/cache/data.bin', new Uint8Array([1, 2, 3]));
const bytes = m.FS.readFile('/memfs/myapp/cache/data.bin');`,
        },
        {
            type: 'callout',
            tone: 'note',
            title: 'm.FS exists only after init',
            text: 'Await the `initNative(...)` promise (or use the `onRuntimeInitialized` hook) before touching it.',
        },

        { type: 'h2', id: 'user-files', text: 'Files the user picked' },
        {
            type: 'p',
            text: 'A `File` from an `<input type=file>` never has a path your C++ can open. `autoMountFiles` streams it in and hands back paths that do - no size limit beyond storage, so multi-gigabyte inputs are fine.',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `const input = document.querySelector('input[type=file]');

input.addEventListener('change', async () => {
    const paths = await m.autoMountFiles(Array.from(input.files));
    // e.g. ['/opfs/myapp/automounted/123456/photo.jpg']
    for (const path of paths) {
        m.processImage(path);
    }
});`,
        },
        {
            type: 'p',
            text: 'Pass a second argument to mount into a known directory instead of a random one: `await m.autoMountFiles(files, \'/opfs/myapp/uploads\')`.',
        },

        { type: 'h2', id: 'reading-back', text: 'Getting results back to JavaScript' },
        {
            type: 'p',
            text: 'C++ writes to a path; JavaScript reads the bytes and does something browser-shaped with them.',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `m.processImage('/opfs/myapp/uploads/photo.jpg');

const bytes = m.getFileBytes('/opfs/myapp/uploads/photo.processed.jpg');
const url = URL.createObjectURL(new Blob([bytes], { type: 'image/jpeg' }));
imgEl.src = url;`,
        },

        { type: 'h2', id: 'per-runtime', text: 'Per-runtime cheat sheet' },
        {
            type: 'table',
            head: ['Runtime', '/opfs/...', '/memfs/...', 'Notes'],
            rows: [
                ['Browser, no worker', 'throws', 'yes', 'tab-session memory only'],
                ['Browser + `useWorker: true`', 'yes, or falls back to `/memfs/`', 'yes', 'the persistent option'],
                ['Node.js', 'n/a', 'n/a', '`m.FS` reads and writes real disk'],
                ['Cloudflare Workers / edge', 'n/a', 'yes', 'per-invocation memory, no persistence'],
                ['React Native', 'n/a', 'n/a', 'the app sandbox, through the platform APIs'],
            ],
        },

        { type: 'h2', id: 'pitfalls', text: 'Pitfalls' },
        {
            type: 'ul',
            items: [
                '**Mounting `/opfs` without a worker** throws inside `getFinalPath()`. Either set `useWorker: true` or write under `/memfs/`.',
                '**Setting `fs: { opfs: false }` and then using `/opfs/...`** throws too - it is disabled, not missing.',
                '**Dropping the `<app>` segment.** Writes to `/memfs/foo` work but sit outside the tree that gets cleaned up on terminate.',
                '**Expecting OPFS to cross origins.** It does not: files written by one origin are invisible to another.',
                '**Needing durable files on the edge.** There is no persistent store there; read bytes from R2/KV/S3 and write them in.',
            ],
        },
    ],
};
