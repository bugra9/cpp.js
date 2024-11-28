import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import state from '../state/index.js';

export default function createXCFramework(createLink = true) {
    if (process.platform !== 'darwin') {
        return;
    }
    const { output } = state.config.paths;
    if (
        !fs.existsSync(`${output}/prebuilt/iOS-iphoneos/lib`)
        || !fs.existsSync(`${output}/prebuilt/iOS-iphonesimulator/lib`)
    ) return;

    const options = {
        cwd: `${output}/prebuilt`,
        stdio: 'inherit',
    };

    state.config.export.libName.forEach((fileName) => {
        if (!fs.existsSync(`${options.cwd}/${fileName}.xcframework`)) {
            const params = [
                '-create-xcframework',
                '-library', `iOS-iphoneos/lib/lib${fileName}.a`,
                '-headers', 'iOS-iphoneos/include',
                '-library', `iOS-iphonesimulator/lib/lib${fileName}.a`,
                '-headers', 'iOS-iphonesimulator/include',
                '-output', `${fileName}.xcframework`,
            ];
            execFileSync('xcodebuild', params, options);
        }

        if (!fs.existsSync(`${options.cwd}/${fileName}.xcframework.zip`)) {
            execFileSync('zip', ['-y', '-r', `./${fileName}.xcframework.zip`, `${fileName}.xcframework`], options);
        }
        if (createLink && !fs.existsSync(`${state.config.paths.project}/${fileName}.xcframework`)) {
            fs.symlinkSync(`${options.cwd}/${fileName}.xcframework`, `${state.config.paths.project}/${fileName}.xcframework`);
        }
    });
}
