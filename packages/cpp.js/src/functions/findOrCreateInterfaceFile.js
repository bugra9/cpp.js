/* eslint-disable prefer-destructuring */
import fs from 'fs';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';
import { getDependencyParams } from './getCmakeParams.js';

export default function findOrCreateInterfaceFile(compiler, filePath) {
    const moduleRegex = new RegExp(`.(${compiler.config.ext.module.join('|')})$`);
    if (moduleRegex.test(filePath) && fs.existsSync(filePath)) {
        const newPath = `${compiler.config.paths.temp}/interface/${filePath.split('/').pop()}`;
        fs.copyFileSync(filePath, newPath);
        compiler.interfaces.push(newPath);
        return filePath;
    }

    const input = getPathInfo(filePath, compiler.config.paths.base);
    const output = getPathInfo(`${compiler.config.paths.temp}/interface`, compiler.config.paths.base);
    const base = getBaseInfo(compiler.config.paths.base);

    const headerPaths = (getDependencyParams(compiler.config)?.pathsOfCmakeDepends?.split(';') || [])
        .filter((d) => d.startsWith(compiler.config.paths.base))
        .map((d) => d.replace(`${compiler.config.paths.base}/`, ''));

    const temp2 = headerPaths
        .map((p) => input.relative.match(new RegExp(`^${p}/.*?/include/(.*?)$`, 'i')))
        .filter((p) => p && p.length === 2);

    const temp = input.relative.match(/^(.*)\..+?$/);
    if (temp.length < 2) return null;

    const filePathWithoutExt = temp[1];
    const interfaceFile = `${compiler.config.paths.base}/${filePathWithoutExt}.i`;

    if (fs.existsSync(interfaceFile)) {
        compiler.interfaces.push(interfaceFile);
        return interfaceFile;
    }

    const fileName = filePathWithoutExt.split('/').at(-1);

    let headerPath = compiler.config.paths.header.find((path) => filePath.startsWith(path));
    if (headerPath) headerPath = filePath.substr(headerPath.length + 1);
    else if (temp2 && temp2.length > 0) headerPath = temp2[0][1];
    else headerPath = input.relative.split('/').at(-1);

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
    const outputFilePath = `${base.withSlash + output.relative}/${fileName}.i`;
    fs.writeFileSync(outputFilePath, content);

    compiler.interfaces.push(outputFilePath);

    return outputFilePath;
}
