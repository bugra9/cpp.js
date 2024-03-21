import { assert } from 'chai';
import fs from 'fs';
import p from 'path';
import * as url from 'node:url';
import { tmpdir } from "os";
import findCMakeListsFile from './findCMakeListsFile.js';

const __filename = url.fileURLToPath(import.meta.url);
const temp = __filename.split('/');
temp.pop();
temp.pop();
const __dirname = temp.join('/');

export function createTempDir(folder) {
    let path = p.join(tmpdir(), "cppjs-app-cli-test");
    if (folder) path = p.join(path, folder);

    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    fs.mkdirSync(path, { recursive: true });

    return path;
}

describe('findCMakeListsFile', function () {
    let tempdir;
    before(async function () {
        tempdir = createTempDir();
    });

    it('find CMakeLists.txt file', async function () {
        const path = findCMakeListsFile(tempdir);
        assert.equal(path, __dirname + '/assets/CMakeLists.txt');
    });
});
