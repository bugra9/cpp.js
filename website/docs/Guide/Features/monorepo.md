# Monorepo
Docker connects to the project's path as the designated working directory. Consequently, it cannot access files outside this specified project path. In scenarios such as a monorepo structure, the base path is defined in the project configuration as the monorepo start path. This allows Docker to connect to that path and access all necessary files.

Here is a minimal example:
```js title="cppjs.config.js"
import getDirName from 'cpp.js/src/utils/getDirName.js'; 

export default { 
  paths: { 
    project: getDirName(import.meta.url), 
    base: '../..', 
  }, 
};
```

In this example, the monorepo's path is specified as two directories up from the project's path.

:::tip
The configuration documentation can be accessed [here](/docs/api/configuration/paths).
:::
