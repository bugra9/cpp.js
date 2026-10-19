import { spawnSync } from 'node:child_process';
import getOsUserAndGroupId from './getOsUserAndGroupId.js';
import pullDockerImage, { getDockerImage } from './pullDockerImage.js';
import { DOCKER_RUN_SECURITY_ARGS } from './dockerSecurity.js';

const OUTPUT_LIMIT = 64 * 1024 * 1024;
const FAILURE_LINES = 40;

// A step on a cache of the whole machine, under ~/.crossbind, which no build's container sees: a run of crossbind's
// linux image of its own, given the directories it works in.
export default function runInLinuxImage(script, { mounts, args = [], what }) {
    pullDockerImage('linux');
    const result = spawnSync('docker', [
        'run', '--rm', ...DOCKER_RUN_SECURITY_ARGS,
        ...mounts.flatMap(([host, container]) => ['-v', `${host}:${container}`]),
        '--user', getOsUserAndGroupId(), getDockerImage('linux'), 'sh', '-c', script, 'sh', ...args,
    ], { encoding: 'utf8', maxBuffer: OUTPUT_LIMIT });
    if (result.error) throw new Error(`crossbind: cannot run docker for ${what}: ${result.error.message}`, { cause: result.error });
    if (result.status !== 0) {
        const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim().split('\n').slice(-FAILURE_LINES).join('\n');
        throw new Error(`crossbind: ${what} failed in the linux image with exit code ${result.status}:\n${output}`);
    }
}
