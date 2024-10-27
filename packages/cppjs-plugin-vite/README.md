# @cpp.js/plugin-vite
**Cpp.js Vite plugin**  
A tool for seamless C++ integration with the Vite.

<a href="https://www.npmjs.com/package/@cpp.js/plugin-vite">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/plugin-vite?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>
<a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/vite">
    <img alt="Docs - React Native" src="https://img.shields.io/badge/Docs_-_Vite-20B2AA?style=for-the-badge" />
</a>

## Integration
To integrate cpp.js into your project using Vite, you can utilize the @cpp.js/plugin-vite plugin. Start by installing these package with the following command:

```sh
npm install @cpp.js/plugin-vite --save-dev
```

To enable the plugin, modify the `vite.config.js` file as shown below.

```diff
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
+ import viteCppjsPlugin from '@cpp.js/plugin-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
+   viteCppjsPlugin(),
  ]
});
```
