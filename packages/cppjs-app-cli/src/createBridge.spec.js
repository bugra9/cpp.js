import { assert } from 'chai';
import fs from 'fs';
import p, {dirname} from 'path';
import * as url from 'node:url';
import { tmpdir } from "os";
import createBridge from './createBridge.js';

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

describe('createBridge', function () {
    let tempdir;
    before(async function () {
        tempdir = createTempDir();
    });

    it('createBridge', async function () {
        const path = __dirname+'/test/data/sample.i';
        const bridgeFilePath = createBridge(path, tempdir);
        const bridgeFileData = fs.readFileSync(bridgeFilePath, 'utf8');

        const startIndex = bridgeFileData.indexOf('#include <emscripten/bind.h>');
        const bridgeFileDataTrim = bridgeFileData.substring(startIndex, bridgeFileData.length).trim();

        const expectedContent =
`#include <emscripten/bind.h>

#include "sample.h"

EMSCRIPTEN_BINDINGS(Sample) {
  emscripten::class_<Sample>("Sample")
    .constructor<>()
    .function("t", &Sample::t)
  ;
}
`.trim();
        assert.equal(bridgeFileDataTrim, expectedContent);
    });
});
