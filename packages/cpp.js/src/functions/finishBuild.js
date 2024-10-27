import fs from 'fs';
import { execFileSync } from 'child_process';
import getPathInfo from '../utils/getPathInfo.js';

export default function finishBuild(compiler) {
    const output = getPathInfo(compiler.config.paths.output, compiler.config.paths.base);
    if (
        !fs.existsSync(`${output.absolute}/prebuilt/iOS-iphoneos/lib`)
        || !fs.existsSync(`${output.absolute}/prebuilt/iOS-iphonesimulator/lib`)
    ) return;

    const options = {
        cwd: `${output.absolute}/prebuilt`,
        stdio: 'inherit',
    };

    compiler.config.export.libName.forEach((fileName) => {
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
        if (!fs.existsSync(`${compiler.config.paths.project}/${fileName}.xcframework`)) {
            fs.symlinkSync(`${options.cwd}/${fileName}.xcframework`, `${compiler.config.paths.project}/${fileName}.xcframework`);
        }
    });
    /* if (fs.existsSync(`${output.absolute}/prebuilt/iOS-iphoneos`)) {
        fs.rmSync(`${output.absolute}/prebuilt/iOS-iphoneos`, { recursive: true, force: true });
    }
    if (fs.existsSync(`${output.absolute}/prebuilt/iOS-iphonesimulator`)) {
        fs.rmSync(`${output.absolute}/prebuilt/iOS-iphonesimulator`, { recursive: true, force: true });
    } */
}
