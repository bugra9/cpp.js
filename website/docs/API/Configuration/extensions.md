# File Extensions
This object specifies the file extensions for source, header, and module files.

Here is a minimal example:
```js
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    ext: {
        source: ['myext' 'cpp'],
    },
    paths: {
        project: getDirName(import.meta.url),
    },
};
```

### Attributes

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| header | array | ['h', 'hpp', 'hxx', 'hh'] | Header file extensions |
| source | array | ['c', 'cpp', 'cxx', 'cc'] | Source file extensions |
| module | array | ['i'] | Module file extensions |

