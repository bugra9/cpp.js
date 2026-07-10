// The JSPI demo needs WebAssembly.Suspending, which Node still gates behind
// --experimental-wasm-jspi; without it the glue aborts at boot ("JSPI not
// supported by current environment").
import { execFile } from 'node:child_process';

const expected = /^(response:|error:)/m;

execFile('node', ['--experimental-wasm-jspi', 'src/index.mjs'], { timeout: 120000 }, (err, stdout, stderr) => {
    const out = `${stdout}\n${stderr}`;
    if (err) {
        console.error(out);
        console.error('run failed:', err.message);
        process.exit(1);
    }
    if (!expected.test(out)) {
        console.error(`unexpected output:\n${out}`);
        process.exit(1);
    }
    console.log('ok:', stdout.trim().split('\n')[0]);
});
