# Paths
This object defines paths, such as the project path.

Here is a minimal example:
```js
export default {
    general: {
        name: 'sampleName',
    },
    paths: {
        config: import.meta.url,
        base: '../..',

    },
};
```

### Attributes

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| config  | string | undefined                                   | Cpp.js config path |
| project | string | config.paths.config parent path             | Project path |
| base    | string | config.paths.project                        | Base path for monorepo structure |
| cache   | string | config.paths.project/.cppjs                 | Cache path |
| build   | string | config.paths.cache/build                    | Build path |
| native  | array  | ['src/native']                              | Source files path |
| module  | array  | config.paths.native                         | Path to the directory containing source files |
| header  | array  | config.paths.native                         | Path to the directory containing header files |
| bridge  | array  | [...config.paths.native, config.paths.temp] | Path to the directory containing bridge files |
| output  | string | config.paths.temp                           | Directory path where the output files will be saved. |
| cmake   | string | auto find CMakeLists.txt path               | Path to the directory containing CMakeLists.txt |
