---
sidebar_position: 2
---

# Vue
Vue uses Vite as its default build tool. You can easily integrate cpp.js into your project that uses Vite or Webpack using a plugin.

### Vite

**Install**

```bash npm2yarn
npm install vite-plugin-cppjs
```

**Configuration**

Add cpp.js plugin to _vite.config.js_.

```diff
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
+ import viteCppjsPlugin from 'vite-plugin-cppjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
+   viteCppjsPlugin(),
  ]
});
```

### Webpack

**Install**

```bash npm2yarn
npm install cppjs-webpack-plugin cppjs-loader
```

**Configuration**

Add cpp.js plugin to _webpack.config.js_.

```diff
+ const CppjsWebpackPlugin = require('webpack-dashboard/plugin');
+ const cppjsWebpackPlugin = new CppjsWebpackPlugin();
+ const compiler = cppjsWebpackPlugin.getCompiler();

module.exports = {
  //...
  plugins: [
+   cppjsWebpackPlugin,
  ],
  module: {
    rules: [
+     {
+       test: /\.h$/,
+       loader: 'cppjs-loader',
+       options: { compiler },
+     }
    ],
  },
};
```
