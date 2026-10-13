import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const CLOUD = 'http://127.0.0.1:9';

let dir;
let home;
beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-cli-'));
    home = path.join(dir, 'home');
    fs.mkdirSync(home);
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

const crossbind = (...args) => spawnSync(process.execPath, [CLI, ...args], {
    cwd: dir,
    encoding: 'utf8',
    env: {
        ...process.env, HOME: home, USERPROFILE: home, CROSSBIND_CLOUD_URL: CLOUD,
    },
});

describe('crossbind outside a project', () => {
    test('prints its version', () => {
        expect(crossbind('--version')).toMatchObject({ status: 0, stdout: `${version}\n` });
        expect(crossbind('-V')).toMatchObject({ status: 0, stdout: `${version}\n` });
    });

    test('asks for a sign-in rather than a package.json on usage and logout', () => {
        const usage = crossbind('usage');
        const logout = crossbind('logout');

        expect(usage.status).toBe(1);
        expect(usage.stderr).toContain(`not signed in to ${CLOUD}; run crossbind login.`);
        expect(logout).toMatchObject({ status: 0, stdout: `crossbind: not signed in to ${CLOUD}.\n` });
    });

    test('sets, reads and deletes a key of ~/.crossbind.json', () => {
        const file = path.join(home, '.crossbind.json');

        expect(crossbind('config', 'set', 'RUNNER', 'LOCAL').status).toBe(0);
        expect(JSON.parse(fs.readFileSync(file, 'utf8')).RUNNER).toBe('LOCAL');
        expect(crossbind('config', 'get', 'RUNNER').stdout).toContain("'LOCAL'");
        expect(crossbind('config', 'delete', 'RUNNER').status).toBe(0);
        expect(JSON.parse(fs.readFileSync(file, 'utf8'))).not.toHaveProperty('RUNNER');
    });

    test('still needs one to list the project configuration or to build', () => {
        [['config', 'list', '-t', 'project'], ['build']].forEach((args) => {
            const { status, stderr } = crossbind(...args);

            expect(status).toBe(1);
            expect(stderr).toContain('no package.json found');
        });
    });
});

describe('crossbind inside a project', () => {
    beforeEach(() => fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'sample-app' })));

    test('lists the system and the project configuration', () => {
        const { status, stdout } = crossbind('config', 'list', '-t', 'all');

        expect(status).toBe(0);
        expect(stdout).toContain('System Configuration');
        expect(stdout).toContain('Project Configuration');
        expect(stdout).toContain("'sample-app'");
    });

    test('lists the commands that need no project in its help', () => {
        const { status, stdout } = crossbind('--help');

        expect(status).toBe(0);
        ['login', 'logout', 'usage', 'account', 'config'].forEach((name) => expect(stdout).toMatch(new RegExp(`^  ${name} `, 'm')));
    });
});
