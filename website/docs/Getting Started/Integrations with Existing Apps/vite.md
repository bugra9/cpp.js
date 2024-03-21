---
sidebar_position: 4
---

# Vite

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
