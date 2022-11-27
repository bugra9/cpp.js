import { assert } from 'chai';
import fs from 'fs';
import p, {dirname} from 'path';
import * as url from 'node:url';
import { tmpdir } from "os";
import findOrCreateInterfaceFile from './findOrCreateInterfaceFile.js';

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

describe('findOrCreateInterfaceFile', function () {
    let tempdir;
    before(async function () {
        tempdir = createTempDir();
    });

    it('find interface file', async function () {
        const path = __dirname+'/test/data/sample.h';
        const interfaceFile = findOrCreateInterfaceFile(path, tempdir);
        assert.equal(interfaceFile, path.replace('.h', '.i'));
    });

    it('create interface file', async function () {
        const path = __dirname+'/test/data/sample2.h';
        const interfaceFile = findOrCreateInterfaceFile(path, tempdir);
        const interfaceFileData = fs.readFileSync(interfaceFile, 'utf8');

        const path2 = __dirname+'/test/data/sample2.ei';
        const interfaceFileData2 = fs.readFileSync(path2, 'utf8');

        assert.equal(
            interfaceFileData.trim().replace(__dirname + '/test/data/', ''),
            interfaceFileData2.trim().replace(__dirname + '/test/data/', '')
        );
    });
});
