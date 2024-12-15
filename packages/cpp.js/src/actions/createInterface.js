/* eslint-disable prefer-destructuring */
import fs from 'node:fs';
import state, { saveCache } from '../state/index.js';
import { getFileHash } from '../utils/hash.js';
import run from './run.js';

export default function createBridgeFile(headerOrModuleFilePath) {
    if (!fs.existsSync(`${state.config.paths.build}/interface`)) {
        fs.mkdirSync(`${state.config.paths.build}/interface`, { recursive: true });
    }
    if (!fs.existsSync(`${state.config.paths.build}/bridge`)) {
        fs.mkdirSync(`${state.config.paths.build}/bridge`, { recursive: true });
    }
    const interfaceFile = createInterfaceFile(headerOrModuleFilePath);
    return createBridgeFileFromInterfaceFile(interfaceFile);
}

function createInterfaceFile(headerOrModuleFilePath) {
    if (!headerOrModuleFilePath) {
        return null;
    }
    const fileHash = getFileHash(headerOrModuleFilePath);
    if (state.cache.hashes[headerOrModuleFilePath] === fileHash) {
        return state.cache.interfaces[headerOrModuleFilePath];
    }

    const moduleRegex = new RegExp(`.(${state.config.ext.module.join('|')})$`);
    const isModule = moduleRegex.test(headerOrModuleFilePath);
    if (isModule) {
        const newPath = `${state.config.paths.build}/interface/${headerOrModuleFilePath.split('/').pop()}`;
        fs.copyFileSync(headerOrModuleFilePath, newPath);
        state.cache.interfaces[headerOrModuleFilePath] = newPath;
        state.cache.hashes[headerOrModuleFilePath] = fileHash;
        saveCache();
        return newPath;
    }

    const headerPaths = (state.config.dependencyParameters?.pathsOfCmakeDepends?.split(';') || [])
        .filter((d) => d.startsWith(state.config.paths.base));

    const temp2 = headerPaths
        .map((p) => headerOrModuleFilePath.match(new RegExp(`^${p}/.*?/include/(.*?)$`, 'i')))
        .filter((p) => p && p.length === 2);

    const temp = headerOrModuleFilePath.match(/^(.*)\..+?$/);
    if (temp.length < 2) return null;

    const filePathWithoutExt = temp[1];
    const interfaceFile = `${filePathWithoutExt}.i`;

    if (fs.existsSync(interfaceFile)) {
        const newPath = `${state.config.paths.build}/interface/${interfaceFile.split('/').at(-1)}`;
        fs.copyFileSync(interfaceFile, newPath);
        state.cache.interfaces[headerOrModuleFilePath] = newPath;
        state.cache.hashes[headerOrModuleFilePath] = fileHash;
        saveCache();
        return newPath;
    }

    const fileName = filePathWithoutExt.split('/').at(-1);

    let headerPath = state.config.paths.header.find((path) => headerOrModuleFilePath.startsWith(path));
    if (headerPath) headerPath = headerOrModuleFilePath.substr(headerPath.length + 1);
    else if (temp2 && temp2.length > 0) headerPath = temp2[0][1];
    else headerPath = headerOrModuleFilePath.split('/').at(-1);

    const content = `#ifndef _${fileName.toUpperCase()}_I
#define _${fileName.toUpperCase()}_I

%module ${fileName.toUpperCase()}

%{
#include "${headerPath}"
%}

%feature("shared_ptr");
%feature("polymorphic_shared_ptr");

%include "${headerPath}"

#endif
`;
    const outputFilePath = `${state.config.paths.build}/interface/${fileName}.i`;
    fs.writeFileSync(outputFilePath, content);

    state.cache.interfaces[headerOrModuleFilePath] = outputFilePath;
    state.cache.hashes[headerOrModuleFilePath] = fileHash;
    saveCache();

    return outputFilePath;
}

function createBridgeFileFromInterfaceFile(interfaceFilePath) {
    if (!interfaceFilePath) {
        return null;
    }

    const fileHash = getFileHash(interfaceFilePath);
    if (state.cache.hashes[interfaceFilePath] === fileHash) {
        return state.cache.bridges[interfaceFilePath];
    }

    const allHeaders = state.config.dependencyParameters.headerPathWithDepends.split(';');

    let includePath = [
        ...state.config.allDependencies.map((d) => `${d.paths.output}/prebuilt/Emscripten-x86_64/include`),
        ...state.config.allDependencies.map((d) => `${d.paths.output}/prebuilt/Emscripten-x86_64/swig`),
        ...state.config.paths.header,
        ...allHeaders,
    ].filter((path) => !!path.toString()).map((path) => `-I${path}`);
    includePath = [...new Set(includePath)];

    run('swig', [
        '-c++',
        '-embind',
        '-o', `${state.config.paths.build}/bridge/${interfaceFilePath.split('/').at(-1)}.cpp`,
        ...includePath,
        interfaceFilePath,
    ]);

    state.cache.bridges[interfaceFilePath] = `${state.config.paths.build}/bridge/${interfaceFilePath.split('/').at(-1)}.cpp`;
    state.cache.hashes[interfaceFilePath] = fileHash;
    saveCache();

    return state.cache.bridges[interfaceFilePath];
}
