import fs from 'fs';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';

export default function findOrCreateInterfaceFile(compiler, filePath) {
    const input = getPathInfo(filePath, compiler.config.paths.base);
    const output = getPathInfo(compiler.config.paths.temp+'/interface', compiler.config.paths.base);
    const base = getBaseInfo(compiler.config.paths.base);

    const temp = input.relative.match(/^(.*)\..+?$/);
    if (temp.length < 2) return null;

    const filePathWithoutExt = temp[1];
    const interfaceFile = filePathWithoutExt + '.i';

    if (fs.existsSync(interfaceFile)) return interfaceFile;

    const fileName = filePathWithoutExt.split('/').at(-1);

    let headerPath = compiler.config.paths.header.find(path => filePath.startsWith(path));
    if (headerPath) headerPath = filePath.substr(headerPath.length+1);
    else headerPath = input.relative.split('/').at(-1);

    const content =
`#ifndef _${fileName.toUpperCase()}_I
#define _${fileName.toUpperCase()}_I

%module ${fileName.toUpperCase()}

%{
#include "${headerPath}"
%}

%include "${headerPath}"

#endif
`;
    const outputFilePath = base.withSlash + output.relative+'/'+fileName+'.i';
    fs.writeFileSync(outputFilePath, content);

    compiler.interfaces.push(outputFilePath);

    return outputFilePath;
}
