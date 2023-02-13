import fs from 'fs';
import { getBaseInfo, getPathInfo } from './utils.js';

export default function findOrCreateInterfaceFile(filePath, outputPath, basePath = process.cwd()) {
    const input = getPathInfo(filePath, basePath);
    const output = getPathInfo(outputPath, basePath);
    const base = getBaseInfo(basePath);

    const temp = input.relative.match(/^(.*)\..+?$/);
    if (temp.length < 2) return null;

    const filePathWithoutExt = temp[1];
    const interfaceFile = filePathWithoutExt + '.i';

    if (fs.existsSync(interfaceFile)) return interfaceFile;

    const fileName = filePathWithoutExt.split('/').at(-1);
    const fileNameWithExt = input.relative.split('/').at(-1);

    const content =
`#ifndef _${fileName.toUpperCase()}_I
#define _${fileName.toUpperCase()}_I

%module ${fileName.toUpperCase()}

%{
#include "${fileNameWithExt}"
%}

%include "${fileNameWithExt}"

#endif
`;
    const outputFilePath = base.withSlash + output.relative+'/'+fileName+'.i';
    fs.writeFileSync(outputFilePath, content);
    return outputFilePath;
}
