import { execFileSync } from 'child_process';

let isDockerImageAvailable = false;

export function getDockerImage() {
    return 'bugra9/cpp.js:0.2.6';
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
        isDockerImageAvailable = true;
    }
}
