import { execFileSync } from 'node:child_process';
import { getContentHash } from './hash.js';

let isDockerImageAvailable = false;

export function getDockerImage() {
    return 'bugra9/cpp.js:0.3.2';
}

export function getDockerContainerName(base) {
    return `${getDockerImage()}-${getContentHash(base)}`.replaceAll('/', '-').replaceAll(':', '-');
}

export default function pullDockerImage() {
    if (isDockerImageAvailable) return;

    const isImageExist = execFileSync('docker', ['images', '-q', getDockerImage()], { encoding: 'utf-8' }).trim() !== '';

    if (!isImageExist) {
        console.log('');
        console.log('===========================================================');
        console.log('============= Downloading the docker image... =============');
        console.log('===========================================================');
        console.log('');
        execFileSync('docker', ['pull', getDockerImage()], { stdio: 'inherit' });
        console.log('');
        console.log('===========================================================');
        console.log('');
    }

    isDockerImageAvailable = true;
}
