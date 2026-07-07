import {
    describe, test, expect, vi,
} from 'vitest';
import crypto from 'node:crypto';

vi.mock('node:child_process', () => ({
    execFileSync: vi.fn(),
}));

// The module keeps availability state (isDockerImageAvailable), so every test imports a fresh
// copy alongside the mocked child_process from the same module graph.
async function importFresh() {
    vi.resetModules();
    const { execFileSync } = await import('node:child_process');
    const mod = await import('../src/utils/pullDockerImage.js');
    return { mod, execFileSync };
}

describe('getDockerImage', () => {
    test('returns the digest-pinned image ref', async () => {
        const { mod } = await importFresh();
        expect(mod.getDockerImage()).toMatch(/^bugra9\/cpp\.js@sha256:[0-9a-f]{64}$/);
    });
});

describe('getDockerContainerName', () => {
    test('builds a valid docker container name from the tag and the base hash', async () => {
        const { mod } = await importFresh();
        const name = mod.getDockerContainerName('/some/base');
        expect(name).toMatch(/^[A-Za-z0-9][A-Za-z0-9_.-]*$/);
        expect(name).not.toContain('@');
        expect(name.startsWith('bugra9-cpp.js-')).toBe(true);
        const baseHash = crypto.createHash('sha256').update('/some/base').digest('hex');
        expect(name.endsWith(`-${baseHash}`)).toBe(true);
    });

    test('is deterministic for the same base path', async () => {
        const { mod } = await importFresh();
        expect(mod.getDockerContainerName('/a/b')).toBe(mod.getDockerContainerName('/a/b'));
        expect(mod.getDockerContainerName('/a/b')).not.toBe(mod.getDockerContainerName('/a/c'));
    });
});

describe('pullDockerImage', () => {
    test('skips docker pull when the image is already present', async () => {
        const { mod, execFileSync } = await importFresh();
        execFileSync.mockReturnValue('');

        mod.default();

        expect(execFileSync).toHaveBeenCalledWith(
            'docker',
            ['image', 'inspect', mod.getDockerImage()],
            expect.objectContaining({ stdio: 'ignore' }),
        );
        const pullCalls = execFileSync.mock.calls.filter(([, args]) => args[0] === 'pull');
        expect(pullCalls).toHaveLength(0);
    });

    test('pulls the image by digest when it is not present locally', async () => {
        const { mod, execFileSync } = await importFresh();
        execFileSync.mockImplementation((cmd, args) => {
            if (args[0] === 'image' && args[1] === 'inspect') {
                throw new Error('No such image');
            }
            return '';
        });

        mod.default();

        expect(execFileSync).toHaveBeenCalledWith(
            'docker',
            ['pull', mod.getDockerImage()],
            expect.objectContaining({ stdio: 'inherit' }),
        );
    });

    test('checks availability only once per process', async () => {
        const { mod, execFileSync } = await importFresh();
        execFileSync.mockReturnValue('');

        mod.default();
        const callsAfterFirst = execFileSync.mock.calls.length;
        mod.default();

        expect(execFileSync.mock.calls.length).toBe(callsAfterFirst);
    });
});
