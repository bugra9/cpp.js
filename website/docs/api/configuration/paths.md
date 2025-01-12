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
| project | string | undefined                                   | Project path |
| base    | string | config.paths.project                        | Base path for monorepo structure |
| temp    | string | config.paths.project/RANDOM                 | Temp path |
| native  | array  | ['src/native']                              | Source files path |
| module  | array  | config.paths.native                         | Path to the directory containing source files |
| header  | array  | config.paths.native                         | Path to the directory containing header files |
| bridge  | array  | [...config.paths.native, config.paths.temp] | Path to the directory containing bridge files |
| output  | string | config.paths.temp                           | Directory path where the output files will be saved. |
| cmake   | string | auto find CMakeLists.txt path               | Path to the directory containing CMakeLists.txt |
