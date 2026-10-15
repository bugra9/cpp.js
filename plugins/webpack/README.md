# @crossbind/plugin-webpack
**crossbind Webpack plugin**  
A tool for seamless C++ integration with the Webpack bundler.

<a href="https://www.npmjs.com/package/@crossbind/plugin-webpack">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@crossbind/plugin-webpack/beta?style=for-the-badge" />
</a>
<a href="https://github.com/crossbind/crossbind/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/crossbind/crossbind?style=for-the-badge" />
</a>
<a href="https://crossbind.dev/docs/guide/integrate-into-existing-project/webpack">
    <img alt="Docs - Webpack" src="https://img.shields.io/badge/Docs_-_Webpack-20B2AA?style=for-the-badge" />
</a>

## Integration
Install the plugin and its loader:

```sh
npm install @crossbind/plugin-webpack@beta @crossbind/plugin-webpack-loader@beta --save-dev
```

**Webpack**  
Register the plugin, its loader rule and its dev server settings in `webpack.config.js`:

```diff
+ const CrossbindWebpackPlugin = require('@crossbind/plugin-webpack').default;
+ const crossbindWebpackPlugin = new CrossbindWebpackPlugin();

module.exports = {
  //...
  plugins: [
+   crossbindWebpackPlugin,
  ],
  module: {
    rules: [
+     crossbindWebpackPlugin.getRule(),
    ],
  },
+ devServer: crossbindWebpackPlugin.getDevServerConfig(),
};
```

**Rspack**  
The same plugin works in `rspack.config.mjs`:

```diff
+ import CrossbindWebpackPlugin from '@crossbind/plugin-webpack';

+ const crossbindWebpackPlugin = new CrossbindWebpackPlugin();

export default defineConfig({
  module: {
    rules: [
+     crossbindWebpackPlugin.getRule(),
    ],
  },
  plugins: [
+   crossbindWebpackPlugin,
  ],
+ devServer: crossbindWebpackPlugin.getDevServerConfig(),
});
```

`getRule()` sends header and Rust imports to the loader, and `getDevServerConfig()` serves the build with the COOP/COEP headers a multithreaded build needs. To keep a `devServer` of your own, spread `getDevServerConfig()` into it.
