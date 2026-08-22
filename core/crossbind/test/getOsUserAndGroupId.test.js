import { describe, test, expect, vi, afterEach } from 'vitest';
import os from 'node:os';

// Module-level memo: each case needs a fresh module registry.
const load = async () => {
    vi.resetModules();
    return (await import('../src/utils/getOsUserAndGroupId.js')).default;
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe('getOsUserAndGroupId', () => {
    test('formats the OS uid and gid as docker expects them', async () => {
        vi.spyOn(os, 'userInfo').mockReturnValue({ uid: 501, gid: 20 });

        const getOsUserAndGroupId = await load();

        expect(getOsUserAndGroupId()).toBe('501:20');
    });

    test('falls back to 0:0 where the platform reports no ids', async () => {
        // Windows reports -1/-1; passing that to `docker run --user` would fail.
        vi.spyOn(os, 'userInfo').mockReturnValue({ uid: -1, gid: -1 });

        const getOsUserAndGroupId = await load();

        expect(getOsUserAndGroupId()).toBe('0:0');
    });

    test('memoizes the first answer', async () => {
        const userInfo = vi.spyOn(os, 'userInfo').mockReturnValue({ uid: 1, gid: 2 });
        const getOsUserAndGroupId = await load();

        expect(getOsUserAndGroupId()).toBe('1:2');
        userInfo.mockReturnValue({ uid: 9, gid: 9 });

        expect(getOsUserAndGroupId()).toBe('1:2');
    });
});
