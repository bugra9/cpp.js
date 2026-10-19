import { describe, expect, test, vi } from 'vitest';

const state = { config: { general: { name: 'demo' } }, targets: [] };
vi.mock('../src/state/index.js', () => ({ default: state }));

const { appLayout, appOutputName } = await import('../src/actions/buildApp.js');

describe('an app on disk', () => {
    test('keeps its executable and its files in a bundle on macOS, and in a directory on Linux', () => {
        expect(appLayout({ platform: 'darwin', arch: 'arm64' })).toEqual({ executable: 'Contents/MacOS/demo', resources: 'Contents/Resources' });
        expect(appLayout({ platform: 'linux', arch: 'x64' })).toEqual({ executable: 'demo', resources: 'resources' });
    });

    test('is named beside the page as a bundle, or as a directory after its platform and arch', () => {
        expect(appOutputName({ platform: 'darwin', arch: 'arm64' })).toBe('demo.app');
        expect(appOutputName({ platform: 'linux', arch: 'x64' })).toBe('demo-linux-x64');
    });
});
