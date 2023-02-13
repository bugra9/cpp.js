import { assert } from 'chai';
import { getBaseInfo, getPathInfo } from './utils.js';

describe('getBaseInfo', function () {
    it('empty', async function () {
        const baseInfo = getBaseInfo('');
        assert.equal(baseInfo.withSlash, '/');
        assert.equal(baseInfo.withoutSlash, '/');
    });

    it('null', async function () {
        const baseInfo = getBaseInfo(null);
        assert.equal(baseInfo.withSlash, '/');
        assert.equal(baseInfo.withoutSlash, '/');
    });

    it('undefined', async function () {
        const baseInfo = getBaseInfo();
        assert.equal(baseInfo.withSlash, '/');
        assert.equal(baseInfo.withoutSlash, '/');
    });

    it('/', async function () {
        const baseInfo = getBaseInfo('/');
        assert.equal(baseInfo.withSlash, '/');
        assert.equal(baseInfo.withoutSlash, '/');
    });

    it('with /', async function () {
        const baseInfo = getBaseInfo('/home/cppjs/');
        assert.equal(baseInfo.withSlash, '/home/cppjs/');
        assert.equal(baseInfo.withoutSlash, '/home/cppjs');
    });

    it('without /', async function () {
        const baseInfo = getBaseInfo('/home/cppjs');
        assert.equal(baseInfo.withSlash, '/home/cppjs/');
        assert.equal(baseInfo.withoutSlash, '/home/cppjs');
    });
});

describe('getPathInfo', function () {
    it('path: absolute', async function () {
        const path = '/home/cppjs/cppjs.h';
        const pathInfo = getPathInfo(path);
        assert.equal(pathInfo.relative, path);
        assert.equal(pathInfo.absolute, path);
    });

    it('path: absolute, base: /', async function () {
        const basePath = '/home/cppjs/';
        const path = '/home/cppjs/cppjs.h';
        const pathInfo = getPathInfo(path, basePath);
        assert.equal(pathInfo.relative, 'cppjs.h');
        assert.equal(pathInfo.absolute, path);
    });

    it('path: absolute, base', async function () {
        const basePath = '/home/cppjs';
        const path = '/home/cppjs/cppjs.h';
        const pathInfo = getPathInfo(path, basePath);
        assert.equal(pathInfo.relative, 'cppjs.h');
        assert.equal(pathInfo.absolute, path);
    });

    it('path: relative, base: /', async function () {
        const basePath = '/home/cppjs/';
        const path = 'cppjs.h';
        const pathInfo = getPathInfo(path, basePath);
        assert.equal(pathInfo.relative, 'cppjs.h');
        assert.equal(pathInfo.absolute, basePath + path);
    });

    it('path: relative, base: ', async function () {
        const basePath = '/home/cppjs';
        const path = 'cppjs.h';
        const pathInfo = getPathInfo(path, basePath);
        assert.equal(pathInfo.relative, 'cppjs.h');
        assert.equal(pathInfo.absolute, basePath + '/' + path);
    });
});
