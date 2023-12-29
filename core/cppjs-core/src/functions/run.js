import { execFileSync } from 'child_process';
import pullDockerImage, { getDockerImage } from '../utils/pullDockerImage.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';

function getParentPath(path) {
    const pathArray = path.split('/');
    pathArray.pop();
    return pathArray.join('/');
}

export default function run(compiler, program, params = [], dockerOptions = {}) {
    pullDockerImage();

    const base = getBaseInfo(compiler.config.paths.base);
    const temp = getPathInfo(compiler.config.paths.temp, compiler.config.paths.base);

    const cMakeParentPath = getParentPath(compiler.config.paths.cmake);

    const options = { cwd: temp.absolute, stdio: dockerOptions.console ? 'inherit' : 'pipe' };
    const args = [
        'run',
        '--user', getOsUserAndGroupId(),
        '-v', `${base.withoutSlash}:/live`,
        '-v', `${compiler.config.paths.cli}:/cli`,
        '-v', `${cMakeParentPath}:/cmake`,
        '--workdir', dockerOptions.workdir || `/live/${temp.relative}`,
        ...(dockerOptions.params || []),
        getDockerImage(),
        program, ...params,
    ];
    execFileSync('docker', args, options);
}
