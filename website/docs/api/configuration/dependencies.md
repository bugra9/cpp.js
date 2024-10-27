# Dependencies
It is an array that contains the dependencies of the project. The array must be provided with the configuration object for the dependency.

Here is a minimal example:
```js
import getDirName from 'cpp.js/src/utils/getDirName.js';
import tiff from '@cpp.js/package-tiff/cppjs.config.js';
import sqlite3 from '@cpp.js/package-sqlite3/cppjs.config.js';

export default {
    dependencies: [
        tiff,
        sqlite3,
    ]
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

:::tip
Below are examples demonstrating various uses of the configurations.  
- [dependencies: [tiff, sqlite3]](https://www.npmjs.com/package/@cpp.js/package-proj?activeTab=code)
:::
