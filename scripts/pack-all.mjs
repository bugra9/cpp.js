import { execFileSync } from 'child_process';

const projectPaths = JSON.parse(execFileSync('pnpm', ['m', 'ls', '--json', '--depth=-1'], { stdio: 'pipe' }))
    .filter(p => !p.private)
    .map(p => p.path);

projectPaths.forEach(p => {
    execFileSync('pnpm', ['pack'], { cwd: p, stdio: 'pipe' })
});

console.log('done');
