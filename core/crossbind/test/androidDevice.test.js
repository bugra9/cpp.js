import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// adb answers as an emulator does: `devices` lists what the test attaches, getprop names the ABIs, pidof the app.
let devices = [];
let abilist = 'arm64-v8a';
let installedKey = 'debug';
const calls = [];
const spawnSync = vi.fn((program, args) => {
    calls.push(args);
    if (args[0] === 'devices') return { status: 0, stdout: `List of devices attached\n${devices.map((d) => `${d}\tdevice\n`).join('')}\n`, stderr: '' };
    if (args.includes('install') && installedKey !== 'debug') {
        return { status: 1, stdout: 'Performing Streamed Install\n', stderr: 'adb: failed to install app-debug.apk: Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package com.example.demo signatures do not match newer version; ignoring!]\n' };
    }
    if (args.includes('getprop')) return { status: 0, stdout: `${abilist}\n`, stderr: '' };
    if (args.includes('pidof')) return { status: 0, stdout: '4242\n', stderr: '' };
    return { status: 0, stdout: '', stderr: '' };
});
const spawn = vi.fn(() => ({ on: () => {} }));
vi.mock('node:child_process', async (importOriginal) => ({ ...await importOriginal(), spawnSync, spawn }));

const { attachedDevice, default: openOnDevice } = await import('../src/actions/androidDevice.js');

let sdk;
let serial;

beforeEach(() => {
    sdk = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-android-sdk-'));
    fs.mkdirSync(path.join(sdk, 'platform-tools'));
    fs.writeFileSync(path.join(sdk, 'platform-tools', 'adb'), '');
    vi.stubEnv('ANDROID_HOME', sdk);
    vi.stubEnv('PATH', '');
    serial = process.env.ANDROID_SERIAL;
    delete process.env.ANDROID_SERIAL;
    devices = [];
    abilist = 'arm64-v8a';
    installedKey = 'debug';
    calls.length = 0;
});

afterEach(() => {
    vi.unstubAllEnvs();
    if (serial !== undefined) process.env.ANDROID_SERIAL = serial;
    fs.rmSync(sdk, { recursive: true, force: true });
});

describe('the Android device an app runs on', () => {
    test('is the one attached, with the first of its ABIs an app builds for', () => {
        devices = ['emulator-5554'];
        abilist = 'x86_64,x86,arm64-v8a';

        expect(attachedDevice()).toEqual({ serial: 'emulator-5554', abi: 'x86_64' });
    });

    test('is none, with a hint to start one', () => {
        expect(() => attachedDevice()).toThrow('no Android device is attached. Start an emulator');
    });

    test('is the one ANDROID_SERIAL names among several', () => {
        devices = ['emulator-5554', 'R58M123'];

        expect(() => attachedDevice()).toThrow('2 Android devices are attached (emulator-5554, R58M123). Set ANDROID_SERIAL');
        vi.stubEnv('ANDROID_SERIAL', 'R58M123');
        expect(attachedDevice().serial).toBe('R58M123');
    });

    test('is reached through an adb the machine has, of which crossbind installs none', () => {
        devices = ['emulator-5554'];
        expect(attachedDevice().serial).toBe('emulator-5554');
        expect(spawnSync.mock.calls.at(-1)[0]).toBe(path.join(sdk, 'platform-tools', 'adb'));

        fs.rmSync(path.join(sdk, 'platform-tools', 'adb'));
        expect(() => attachedDevice()).toThrow('brew install --cask android-platform-tools');
    });

    test('is reached through the adb on PATH before the SDK\'s', () => {
        devices = ['emulator-5554'];
        const bin = path.join(sdk, 'bin');
        fs.mkdirSync(bin);
        fs.writeFileSync(path.join(bin, 'adb'), '');
        vi.stubEnv('PATH', bin);

        attachedDevice();

        expect(spawnSync.mock.calls.at(-1)[0]).toBe(path.join(bin, 'adb'));
    });

    test('runs an ABI an app builds for', () => {
        devices = ['old-phone'];
        abilist = 'armeabi-v7a,armeabi';

        expect(() => attachedDevice()).toThrow('runs armeabi-v7a, armeabi, and apps build for arm64-v8a and x86_64');
    });
});

describe('an Android app opened on the device', () => {
    test('installs, reaches the dev server through adb reverse, starts with its extras and relays its own log', () => {
        devices = ['emulator-5554'];
        const apk = path.join(sdk, 'app-debug.apk');
        fs.writeFileSync(path.join(sdk, 'output-metadata.json'), JSON.stringify({ applicationId: 'com.example.demo' }));

        const { child } = openOnDevice(apk, { env: { CROSSBIND_APP_URL: 'http://localhost:5173/?a=1&b=2', CROSSBIND_APP_CONSOLE: "it's" } });

        expect(calls).toContainEqual(['-s', 'emulator-5554', 'install', '-r', '-d', apk]);
        expect(calls).toContainEqual(['-s', 'emulator-5554', 'reverse', 'tcp:5173', 'tcp:5173']);
        expect(calls).toContainEqual(['-s', 'emulator-5554', 'shell', 'am', 'start', '-S', '-W', '-n', 'com.example.demo/dev.crossbind.app.CrossbindActivity',
            '--es', 'CROSSBIND_APP_URL', "'http://localhost:5173/?a=1&b=2'", '--es', 'CROSSBIND_APP_CONSOLE', "'it'\\''s'"]);
        const [, relay] = spawn.mock.calls.at(-1);
        expect(relay.at(-1)).toBe("logcat -v raw --pid=4242 -s Crossbind:V | grep -v '^--------- ' & while [ -d /proc/4242 ]; do sleep 1; done; "
            + "pkill -f '^logcat -v raw --pid=4242 -s Crossbind:V'");
        expect(child).toBeDefined();
    });

    test('names the uninstall an app signed with another key needs, and leaves it to the developer, as it takes the data', () => {
        devices = ['emulator-5554'];
        installedKey = 'upload';
        fs.writeFileSync(path.join(sdk, 'output-metadata.json'), JSON.stringify({ applicationId: 'com.example.demo' }));

        expect(() => openOnDevice(path.join(sdk, 'app-debug.apk'))).toThrow('`adb -s emulator-5554 uninstall com.example.demo` removes it, with its data');
        expect(calls.some((args) => args.includes('uninstall'))).toBe(false);
    });
});
