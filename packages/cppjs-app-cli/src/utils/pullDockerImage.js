import { execFileSync } from 'child_process';

export default function pullDockerImage() {
    const isImageExist = execFileSync("docker", ["images", "-q", "bugra9/cpp.js:0.2.0"], {encoding: 'utf-8'}).trim() !== '';

    if (!isImageExist) {
        console.log('');
        console.log('===========================================================');
        console.log('============= Downloading the docker image... =============');
        console.log('===========================================================');
        console.log('');
        execFileSync("docker", ["pull", "bugra9/cpp.js"], {stdio: 'inherit'});
        console.log('');
        console.log('===========================================================');
        console.log('');
    }
}
