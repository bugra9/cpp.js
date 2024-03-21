---
sidebar_position: 3
---

# Rollup

**Install**

```bash npm2yarn
npm install rollup-plugin-cppjs
```

**Configuration**

Add cpp.js plugin to _vite.config.js_.

```diff
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
+ import rollupCppjsPlugin from 'rollup-plugin-cppjs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
+   rollupCppjsPlugin(),
  ]
});
```
