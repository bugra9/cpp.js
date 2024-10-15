# Overview

If you have an existing project, this guide will walk you through integrating Cpp.js. There are two ways to do this:

- Use a plugin compatible with your project's bundler to integrate Cpp.js.
- Compile native code with Cpp.js and directly import the generated JavaScript file.

**Advantages of Using Plugins:**

- **Automation:** The process is fully automated.
- **Code Optimization:** Unused code is excluded from the output.
- **Development Mode:** Supports a streamlined development experience.

If you are using a bundler you can continue with its page. If not, you can integrate it manually with the help of the [standalone page](standalone).

| Web                      | Mobile                       | Backend           | Cloud                                  |
| ------------------------ | ---------------------------- | ----------------- | -------------------------------------- |
| [Standalone](standalone) | [React Native](react-native) | [Node.js](nodejs) | [Cloudflare Worker](cloudflare-worker) |
| [Webpack](webpack)       | Expo (Coming Soon)           |                   |                                        |
| [Rollup](rollup)         |                              |                   |                                        |
| [Vite](vite)             |                              |                   |                                        |
| [Rspack](rspack)         |
| [CRA(Create React App)](create-react-app)         |
:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/guide/getting-started/prerequisites) for setting up a working development environment.
:::
