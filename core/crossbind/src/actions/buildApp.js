import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import virtual from '@rollup/plugin-virtual';
import run from './run.js';
import createLib from './createLib.js';
import getData from './getData.js';
import getEnv from './getEnv.js';
import { filesUnder, linkInputs } from './buildNode.js';
import { suppressNodeBuiltinWarnings } from './buildJs.js';
import { isNativeSourceNewerThan } from './isSourceNewer.js';
import { createNativeBridges } from './nativeBridges.js';
import state from '../state/index.js';
import logger from '../utils/logger.js';
import findFiles from '../utils/findFiles.js';
import { getContentHash, getFilesFingerprint } from '../utils/hash.js';
import { writeNativeSourceStamp } from '../utils/nativeSourceStamp.js';
import resetCMakeCacheForSource from '../utils/resetCMakeCacheForSource.js';
import resolveAppHostRoot, { resolveAppEmbindJsiRoot } from '../utils/resolveAppHost.js';
import resolveHermes, { HERMES, resolveLinuxHermes } from '../utils/hermes.js';
import resolveWebkitGtkSysroot from '../utils/webkitgtkSysroot.js';
import { chosenRunner } from '../utils/selectRunner.js';
import { DARWIN_DEPLOYMENT_TARGET } from '../utils/darwinToolchain.js';

const cpuCount = Math.max(1, os.cpus().length - 1);
const BRIDGE = 'AppBridge';
const LINUX_MULTIARCH = { x64: 'x86_64-linux-gnu', arm64: 'aarch64-linux-gnu' };

// Where an app keeps its executable and its files: a macOS bundle, or a Linux directory.
export function appLayout(target) {
    const { name } = state.config.general;
    return target.platform === 'darwin'
        ? { executable: `Contents/MacOS/${name}`, resources: 'Contents/Resources' }
        : { executable: name, resources: 'resources' };
}

// The name a bundler gives the app beside the page it built.
export const appOutputName = (target) => (target.platform === 'darwin'
    ? `${state.config.general.name}.app`
    : `${state.config.general.name}-${target.platform}-${target.arch}`);

// A machine-wide cache made visible to a build's container: mirrored under the build directory, by hard links where the
// disk allows them.
function mirrorIntoBuild(source, name) {
    const dest = `${state.config.paths.build}/app-inputs/${name}`;
    const marker = `${dest}/.source`;
    if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8') === source) return dest;
    fs.rmSync(dest, { recursive: true, force: true });
    const mirror = (from, to) => {
        fs.mkdirSync(to, { recursive: true });
        for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
            const [file, copy] = [path.join(from, entry.name), path.join(to, entry.name)];
            if (entry.isDirectory()) {
                mirror(file, copy);
            } else if (entry.isSymbolicLink()) {
                fs.symlinkSync(fs.readlinkSync(file), copy);
            } else {
                try {
                    fs.linkSync(file, copy);
                } catch {
                    fs.copyFileSync(file, copy);
                }
            }
        }
    };
    mirror(source, dest);
    fs.writeFileSync(marker, source);
    return dest;
}

// What a host takes from the machine: Hermes, and on Linux the WebKitGTK it compiles and links against, built in the
// linux image, which reaches them only under the build directory.
async function hostInputs(target) {
    if (target.platform === 'darwin') {
        const hermes = await resolveHermes();
        return { hermes, cmakeArgs: [], inputs: [hermes] };
    }
    const runner = chosenRunner(state.config.system);
    if (!['DOCKER_RUN', 'DOCKER_EXEC'].includes(runner)) {
        throw new Error(`crossbind: a Linux app builds in crossbind's linux image, which RUNNER=${runner} does not use. Build it with RUNNER=DOCKER_RUN.`);
    }
    const hermesCache = await resolveLinuxHermes(target.arch);
    const gtkCache = await resolveWebkitGtkSysroot(target.arch);
    return {
        hermes: mirrorIntoBuild(hermesCache, `hermes-linux-${target.arch}`),
        cmakeArgs: [
            `-DCROSSBIND_GTK_SYSROOT=${mirrorIntoBuild(gtkCache, `webkitgtk-linux-${target.arch}`)}`,
            `-DCROSSBIND_GTK_MULTIARCH=${LINUX_MULTIARCH[target.arch]}`,
        ],
        inputs: [hermesCache, gtkCache],
    };
}

// The app host package's scripts import crossbind's own runtime modules under crossbind/runtime/.
const runtimeModules = () => ({
    name: 'crossbind-runtime-modules',
    resolveId: (id) => (id.startsWith('crossbind/runtime/')
        ? `${state.config.paths.cli}/assets/js-runtime/${id.slice('crossbind/runtime/'.length)}`
        : null),
});

async function bundle(input, file, plugins) {
    const build = await rollup({ input, plugins, onwarn: suppressNodeBuiltinWarnings });
    await build.write({ file, format: 'iife' });
    await build.close();
}

function infoPlist(name, version) {
    const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const strings = {
        CFBundleExecutable: name,
        CFBundleIdentifier: `dev.crossbind.${name.replace(/[^A-Za-z0-9.-]/g, '-')}`,
        CFBundleName: name,
        CFBundlePackageType: 'APPL',
        CFBundleShortVersionString: version,
        CFBundleVersion: version,
        LSMinimumSystemVersion: DARWIN_DEPLOYMENT_TARGET,
        NSPrincipalClass: 'NSApplication',
    };
    const entries = Object.entries(strings).map(([key, value]) => `    <key>${key}</key>\n    <string>${escape(value)}</string>`);
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
        + `<plist version="1.0">\n<dict>\n${entries.join('\n')}\n    <key>NSHighResolutionCapable</key>\n    <true/>\n</dict>\n</plist>\n`;
}

// Everything but the page: the host, the host's bytecode and the data the packages ship, and on macOS Hermes beside it.
function assembleApp(target, { executable, hbc, hermes }) {
    const app = `${state.config.paths.build}/${target.appName}`;
    const { name } = state.config.general;
    const layout = appLayout(target);
    fs.rmSync(app, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(`${app}/${layout.executable}`), { recursive: true });
    fs.mkdirSync(`${app}/${layout.resources}/page`, { recursive: true });
    fs.copyFileSync(executable, `${app}/${layout.executable}`);
    fs.copyFileSync(hbc, `${app}/${layout.resources}/host.hbc`);
    Object.entries(getData('data', target)).forEach(([source, dataName]) => {
        if (fs.existsSync(source)) fs.cpSync(source, `${app}/${layout.resources}/data/${dataName}`, { recursive: true });
    });
    if (target.platform !== 'darwin') return;
    fs.writeFileSync(`${app}/Contents/Info.plist`, infoPlist(name, state.config.package?.version ?? '1.0.0'));
    const framework = `${app}/Contents/Frameworks/hermesvm.framework`;
    fs.cpSync(`${hermes}/Library/Frameworks/macosx/hermesvm.framework`, framework, { recursive: true, verbatimSymlinks: true });
    // The release carries Intel and Apple silicon; an app of one arch needs its own half.
    const library = `${framework}/Versions/Current/hermesvm`;
    run(null, ['lipo', library, '-thin', target.arch === 'x64' ? 'x86_64' : 'arm64', '-output', `${library}.thin`], null, target);
    fs.renameSync(`${library}.thin`, library);
}

// A Linux app also ships as one archive, next to its directory.
function archiveApp(app) {
    const result = spawnSync('tar', ['-czf', `${app}.tar.gz`, '-C', path.dirname(app), path.basename(app)], {
        encoding: 'utf8',
        env: { ...process.env, COPYFILE_DISABLE: '1' },
    });
    if (result.status !== 0) throw new Error(`crossbind: cannot archive ${app}: ${result.stderr || result.error?.message}`);
}

// Apple silicon runs signed code only, and a bundle's signature covers every file in it, so an app is signed once the
// page is in: ad hoc, which runs on the machine that built it.
function signApp(app, target) {
    run(null, ['codesign', '--force', '--sign', '-', '--timestamp=none', `${app}/Contents/Frameworks/hermesvm.framework`], null, target);
    run(null, ['codesign', '--force', '--sign', '-', '--timestamp=none', app], null, target);
}

// The built app with a page's files at `to`: the bundler's output for its page, or the project's output for a build
// with none.
export function publishApp(target, { to = `${state.config.paths.output}/${target.appName}`, page = null } = {}) {
    const built = `${state.config.paths.build}/${target.appName}`;
    if (path.resolve(to) !== path.resolve(built)) {
        fs.rmSync(to, { recursive: true, force: true });
        fs.cpSync(built, to, { recursive: true, verbatimSymlinks: true });
    }
    if (page) {
        // The app may land inside the page's own directory, which it then leaves out, with its archive.
        const own = new Set([path.basename(to), `${path.basename(to)}.tar.gz`]);
        fs.readdirSync(page).filter((entry) => !entry.endsWith('.app') && !own.has(entry)).forEach((entry) => {
            fs.cpSync(`${page}/${entry}`, `${to}/${appLayout(target).resources}/page/${entry}`, { recursive: true });
        });
    }
    if (target.platform === 'darwin') signApp(to, target);
    else archiveApp(to);
    return to;
}

// Builds an app's host from the project's archives and the given bridges, its Hermes bytecode and the page runtime the
// page loads as crossbind.js, and puts them into an app without a page.
export default async function buildApp(target, { bridges = [], force = false } = {}) {
    if (target.platform === 'darwin' && process.platform !== 'darwin') {
        logger.info(`[${target.path}] app skipped (macOS apps build on a macOS host)`);
        return false;
    }
    if (state.config.export.type === 'cargo') {
        logger.info(`[${target.path}] app skipped (cargo package - staticlib only)`);
        return false;
    }

    const buildType = target.buildType === 'release' ? 'Release' : 'Debug';
    const { build } = state.config.paths;
    const appHostRoot = resolveAppHostRoot();
    const jsiRoot = resolveAppEmbindJsiRoot();
    const { hermes, cmakeArgs, inputs } = await hostInputs(target);

    // The bridges compile against the embind runtime, which speaks the JSI of the Hermes the host links.
    const headerDirs = [`${jsiRoot}/cpp/src`, `${hermes}/include`];
    createLib(target, BRIDGE, {
        buildSource: false,
        nativeGlob: [`${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`, ...bridges],
        headerDirs,
        inputs: headerDirs.flatMap((dir) => findFiles('**/*.h', { cwd: dir })),
    });
    const { libs, linkArgs, extraSources } = linkInputs(target, { bridge: BRIDGE });

    const fingerprintFile = `${build}/${target.appName}.fingerprint`;
    const fingerprint = getContentHash(JSON.stringify({
        builder: getFilesFingerprint([fileURLToPath(import.meta.url)]),
        hermes: HERMES.version,
        inputs,
        linkArgs,
        libs: libs.map((lib) => {
            const stat = fs.existsSync(lib) ? fs.statSync(lib) : null;
            return { lib, size: stat ? stat.size : null, mtimeMs: stat ? stat.mtimeMs : null };
        }),
        env: getEnv(target),
        data: getData('data', target),
        version: state.config.package?.version,
        runtime: getFilesFingerprint(filesUnder([
            `${appHostRoot}/cpp`, `${appHostRoot}/js`, `${appHostRoot}/third_party`, `${jsiRoot}/cpp/src`, `${jsiRoot}/js`,
            `${state.config.paths.cli}/assets/js-runtime/adapters`,
        ])),
        extraSources: getFilesFingerprint(extraSources),
    }));
    const isChanged = !fs.existsSync(fingerprintFile) || fs.readFileSync(fingerprintFile, { encoding: 'utf8' }) !== fingerprint;
    if (!force && !isChanged && fs.existsSync(`${build}/${target.appName}`) && fs.existsSync(`${build}/${target.appJsName}`)) {
        logger.cachedStep(target, 'app');
        return false;
    }

    const platformPrefix = `App-${buildType}`;
    const workDir = `${build}/${platformPrefix}/${target.path}`;
    const { name } = state.config.general;
    logger.startStep(target, 'app');
    resetCMakeCacheForSource(workDir, `${appHostRoot}/cpp`, target);
    run(null, [
        'cmake', `${appHostRoot}/cpp`,
        `-DCMAKE_BUILD_TYPE=${buildType}`,
        `-DCROSSBIND_APP_FILE=${name}`,
        `-DCROSSBIND_JSI_ROOT=${jsiRoot}`,
        `-DCROSSBIND_HERMES=${hermes}`,
        `-DCROSSBIND_EXTRA_SOURCES=${extraSources.join(';')}`,
        `-DCROSSBIND_LINK_ARGS=${linkArgs.join(';')}`,
        `-DCROSSBIND_LINK_DEPENDS=${libs.join(';')}`,
        ...cmakeArgs,
    ], platformPrefix, target);
    run(null, ['cmake', '--build', '.', '-j', String(cpuCount)], platformPrefix, target, { exclusive: true });

    const systemConfig = `export default ${JSON.stringify({ env: getEnv(target) })};`;
    await bundle(`${appHostRoot}/js/host.js`, `${workDir}/host.js`, [
        virtual({ 'crossbind/systemConfig': systemConfig }), runtimeModules(), nodeResolve(), commonjs(),
    ]);
    // Without -Xes6-block-scoping, hermesc compiles let and const as var, and closures made in a loop share one binding.
    run(null, [`${hermes}/bin/hermesc`, '-O', '-Xes6-block-scoping', '-emit-binary', '-out', `${workDir}/host.hbc`, `${workDir}/host.js`],
        platformPrefix, target);
    await bundle(`${appHostRoot}/js/page.js`, `${build}/${target.appJsName}`, []);
    assembleApp(target, { executable: `${workDir}/${name}`, hbc: `${workDir}/host.hbc`, hermes });
    logger.doneStep(target, 'app');

    fs.writeFileSync(fingerprintFile, fingerprint);
    writeNativeSourceStamp(`${build}/${target.appName}`, state.config.paths.native);
    return true;
}

// The app of the project as it stands, for a bundler plugin, which needs the host before the page asks for anything:
// the bridges a plain build binds, found in the project's headers and sources, then its own archive and the host.
export async function buildProjectApp(target) {
    const bridges = createNativeBridges([target]).headers.flatMap((header) => header.bridge ?? []);
    const force = isNativeSourceNewerThan(`${state.config.paths.build}/${target.appName}`);
    createLib(target, 'Source', { force, buildSource: true });
    return buildApp(target, { bridges, force });
}
