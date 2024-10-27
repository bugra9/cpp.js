# File System
Cpp.js uses a virtual file system in the browser. To easily interact with this virtual file system, a set of helper JavaScript functions is provided. These functions:

| Function | Platform | Input | Output | Description |
| -------- | -------- | ----- | ------ | ----------- |
| generateVirtualPath | browser | | | Creates a directory at `/virtual/automounted/{{RANDOM}}` |
| autoMountFiles | browser | FileList \| [File] | [string] | Auto mount files. |
| getFileBytes | browser, node.js | string | Uint8Array | Returns the file at the specified path in bytes. |
| getFileList | browser, node.js | string | [\{ path: string, size: number }] | Returns the files with path and size at the specified path. |

<br />

### Examples  
**Opening file from file input.**
```js
// HTML
<input class="input-file" type="file" name="file" id="file" onChange="onFileChange" />
// JS
function onFileChange({ target }) {
  const files = Module.autoMountFiles([target.file]);
}
```

**Opening files from file input. (multiple)**
```js
// HTML
<input class="input-file" type="file" name="files[]" id="file" onChange="onFileChange" multiple />
// JS
function onFileChange({ target }) {
  const result = Module.autoMountFiles(target.files);
}
```

**Opening a file from the network.**
```js
const fileData = await fetch('test/polygon.geojson');
const file = new File([await fileData.blob()], "polygon.geojson");
const result = Module.autoMountFiles([file]);
```

**Download file from "/output" path on the browser.**
```js
const filePath = '/virtual/test.json';
const fileBytes = Module.getFileBytes(filePath);
const fileName = filePath.split('/').pop();
saveAs(fileBytes, filename);

function saveAs(fileBytes, fileName) {
   const blob = new Blob([fileBytes]);
   const link = document.createElement('a');
   link.href = URL.createObjectURL(blob);
   link.download = fileName;
   link.click();
}
```

**Displays information about the files.**
```js
const files = Module.getFileList();
files.forEach((fileInfo) => {
  console.log(`file path: ${fileInfo.path}, file size: ${fileInfo.size}`);
});
```

<br />

:::info
**Browser Functions:** You can access the browser functions from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cpp.js/src/assets/browser.js).  
**Node.js Functions:** You can access the Node.js functions from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cpp.js/src/assets/node.js).  
:::
