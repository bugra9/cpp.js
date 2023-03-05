import { execFileSync } from 'child_process';

export default function pullDockerImage() {
    const isImageExist = execFileSync("docker", ["images", "-q", getDockerImage()], {encoding: 'utf-8'}).trim() !== '';

    if (!isImageExist) {
        console.log('');
        console.log('===========================================================');
        console.log('============= Downloading the docker image... =============');
        console.log('===========================================================');
        console.log('');
        execFileSync("docker", ["pull", getDockerImage], {stdio: 'inherit'});
        console.log('');
        console.log('===========================================================');
        console.log('');
    }
}

export function getDockerImage() {
    return "bugra9/cpp.js:0.2.0";
}
