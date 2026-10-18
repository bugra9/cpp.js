import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
import resolveHermes, { HERMES } from '../utils/hermes.js';
import { DARWIN_DEPLOYMENT_TARGET } from '../utils/darwinToolchain.js';

const cpuCount = Math.max(1, os.cpus().length - 1);
const BRIDGE = 'AppBridge';

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

// Everything but the page: the host, Hermes beside it, the host's bytecode and the data the packages ship.
function assembleApp(target, { executable, hbc, hermes }) {
    const app = `${state.config.paths.build}/${target.appName}`;
    const { name } = state.config.general;
    fs.rmSync(app, { recursive: true, force: true });
    fs.mkdirSync(`${app}/Contents/MacOS`, { recursive: true });
    fs.mkdirSync(`${app}/Contents/Frameworks`, { recursive: true });
    fs.mkdirSync(`${app}/Contents/Resources/page`, { recursive: true });
    fs.writeFileSync(`${app}/Contents/Info.plist`, infoPlist(name, state.config.package?.version ?? '1.0.0'));
    fs.copyFileSync(executable, `${app}/Contents/MacOS/${name}`);
    const framework = `${app}/Contents/Frameworks/hermesvm.framework`;
    fs.cpSync(`${hermes}/Library/Frameworks/macosx/hermesvm.framework`, framework, { recursive: true, verbatimSymlinks: true });
    // The release carries Intel and Apple silicon; an app of one arch needs its own half.
    const library = `${framework}/Versions/Current/hermesvm`;
    run(null, ['lipo', library, '-thin', target.arch === 'x64' ? 'x86_64' : 'arm64', '-output', `${library}.thin`], null, target);
    fs.renameSync(`${library}.thin`, library);
    fs.copyFileSync(hbc, `${app}/Contents/Resources/host.hbc`);
    Object.entries(getData('data', target)).forEach(([source, dataName]) => {
        if (fs.existsSync(source)) fs.cpSync(source, `${app}/Contents/Resources/data/${dataName}`, { recursive: true });
    });
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
        // The app may land inside the page's own directory, which it then leaves out.
        fs.readdirSync(page).filter((entry) => !entry.endsWith('.app')).forEach((entry) => {
            fs.cpSync(`${page}/${entry}`, `${to}/Contents/Resources/page/${entry}`, { recursive: true });
        });
    }
    signApp(to, target);
    return to;
}

// Builds an app's host from the project's archives and the given bridges, its Hermes bytecode and the page runtime the
// page loads as crossbind.js, and puts them into an app without a page.
export default async function buildApp(target, { bridges = [], force = false } = {}) {
    if (process.platform !== 'darwin') {
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
    const hermes = await resolveHermes();

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
