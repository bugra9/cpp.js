import fs from 'fs';

export default function findOrCreateInterfaceFile(filePath, outputPath) {
    const temp = filePath.match(/^(.*)\..+?$/);
    if (temp.length < 2) return null;

    const filePathWithoutExt = temp[1];
    const interfaceFile = filePathWithoutExt + '.i';

    if (fs.existsSync(interfaceFile)) return interfaceFile;

    const fileName = filePathWithoutExt.split('/').at(-1);
    const fileNameWithExt = filePath.split('/').at(-1);

    const content =
`#ifndef _${fileName.toUpperCase()}_I
#define _${fileName.toUpperCase()}_I

%module ${fileName.toUpperCase()}

%{
#include "${fileNameWithExt}"
%}

%include "/live${filePath}"

#endif
`;

    const outputFilePath = outputPath+'/'+fileName+'.i';
    fs.writeFileSync(outputFilePath, content);
    return outputFilePath;
}
