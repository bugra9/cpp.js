import fs from 'node:fs';
import upath from 'upath';
import { execFileSync } from 'node:child_process';
import state from '../state/index.js';
import logger from '../utils/logger.js';
import { getTargetParams, getFilteredBuildTargets } from './target.js';

const iOSDevPath = '/Applications/Xcode.app/Contents/Developer';
const iosBinPath = `${iOSDevPath}/Toolchains/XcodeDefault.xctoolchain/usr/bin`;
const iosRanLibBin = `${iosBinPath}/ranlib`;

function runQuiet(bin, params, options) {
    try {
        execFileSync(bin, params, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
        if (e.stdout?.length) process.stderr.write(e.stdout);
        if (e.stderr?.length) process.stderr.write(e.stderr);
        throw e;
    }
}

export default function createXCFramework(overrideConfig = null) {
    if (process.platform !== 'darwin') {
        logger.info('XCFramework not created because platform is not darwin.');
        return;
    }

    const output = overrideConfig?.paths?.output || state.config.paths.output;
    const projectPath = overrideConfig?.paths?.project || state.config.paths.project;
    const libName = overrideConfig?.export?.libName || state.config.export.libName;

    const options = { cwd: projectPath };

    const relativeOutput = upath.relative(projectPath, output);

    const targetParams = overrideConfig?.targetParams || getTargetParams();
    const buildTargets = getFilteredBuildTargets(targetParams, { platform: 'ios', runtime: 'mt', buildType: (targetParams.buildType && targetParams.buildType.length > 0) ? targetParams.buildType[0] : 'release' });

    if (buildTargets.some(t => !fs.existsSync(`${output}/prebuilt/${t.path}/lib`))) {
        logger.info('XCFramework not created because some of the build targets are not built.');
        return;
    }

    const targets = {};
    buildTargets.forEach((target) => {
        const p = `${target.platform}-${target.runtime}-${target.buildType}`;
        if (!targets[p]) {
            targets[p] = {};
        }
        targets[p][target.arch] = target;
    });

    libName.forEach((fileName) => {
        Object.values(targets).forEach((a) => {
            const targets = Object.values(a);
            // const targetName = `${fileName}-${targets[0].runtime}-${targets[0].buildType}.xcframework`;
            const targetName = `${fileName}.xcframework`;
            const targetPath = `${projectPath}/${targetName}`;
            // Always recreate: the xcframework wraps the freshly built static libs which contain
            // the user's bridge bindings. If we keep a stale xcframework around, the linker
            // (via the podspec's vendored_frameworks + force_load) will pull in old bindings
            // and runtime calls like `Module.<UserClass>` resolve to undefined. xcodebuild
            // -create-xcframework refuses to overwrite, so delete first.
            if (fs.existsSync(targetPath)) {
                fs.rmSync(targetPath, { recursive: true, force: true });
            }
            const taskLabel = `xcframework ${targetName}`;
            logger.startTask(taskLabel);
            const params = ['-create-xcframework'];
            targets.forEach((target) => {
                runQuiet(iosRanLibBin, [`${relativeOutput}/prebuilt/${target.path}/lib/lib${fileName}.a`], options);
                params.push(
                    '-library', `${relativeOutput}/prebuilt/${target.path}/lib/lib${fileName}.a`,
                    '-headers', `${relativeOutput}/prebuilt/${target.path}/include`,
                );
            });
            params.push('-output', targetName);
            runQuiet('xcodebuild', params, options);
            logger.doneTask(taskLabel);
        });
    });
}
