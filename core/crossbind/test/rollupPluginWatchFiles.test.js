import { describe, expect, test, vi } from 'vitest';

// The Rollup plugin's header transform with crossbind stood in for: which files it asks the bundler to watch with the
// header. Vite takes those for imports of the header.
vi.mock('crossbind', () => ({
    state: { config: { target: {}, ext: { header: ['h'], module: ['i'] }, paths: { project: '/project' } } },
    getTargetParams: () => ({}),
    getFilteredBuildTargets: () => [{ buildType: 'release' }],
    createBridgeFile: () => '/project/.crossbind/build/bridge/native.i.cpp',
    getCrossbindScript: () => 'export {};',
    appSourceFiles: () => ['/project/src/main.js'],
    createLib: vi.fn(),
    buildWasm: vi.fn(),
    getRustJsScript: vi.fn(),
    buildDependencies: vi.fn(),
    getDependFilePath: vi.fn(),
    isSourceNewer: vi.fn(),
    buildProjectApp: vi.fn(),
    publishApp: vi.fn(),
}));

const { default: rollupCrossbindPlugin } = await import('../../../plugins/rollup/index.js');

async function watchedWithHeader(command) {
    const plugin = rollupCrossbindPlugin();
    if (command) plugin.configResolved({ base: '/', command });
    const watched = [];
    await plugin.transform.call({ addWatchFile: (file) => watched.push(file) }, '', '/project/src/native/native.h');
    return watched;
}

describe('the Rollup plugin', () => {
    test('has a watching build transform a header again after an edit to any source, whose imports decide what it binds', async () => {
        expect(await watchedWithHeader(null)).toEqual(['/project/src/main.js']);
        expect(await watchedWithHeader('build')).toEqual(['/project/src/main.js']);
    });

    test("leaves the sources out of a header's imports on Vite's dev server, so an edit to the page still reaches it", async () => {
        expect(await watchedWithHeader('serve')).toEqual([]);
    });
});
