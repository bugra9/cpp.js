# create-cpp.js
**Create Cpp.js Applications**  

<a href="https://www.npmjs.com/package/create-cpp.js">
    <img alt="NPM version" src="https://img.shields.io/npm/v/create-cpp.js?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>
<a href="https://cpp.js.org/docs/guide/getting-started/create-a-project">
    <img alt="Docs - Create App" src="https://img.shields.io/badge/Docs_-_Create_App-20B2AA?style=for-the-badge" />
</a>

# Getting Started

>**Note**: Make sure you have completed the [Cpp.js - Prerequisites](https://cpp.js.org/docs/guide/getting-started/prerequisites) instructions.

```bash
npm init cpp.js@latest
```

This command will install and execute create-cpp.js, the official Cpp.js project scaffolding tool. You will be presented with prompts for several optional features such as React.

```
Welcome to Cpp.js!

✔ Project Name … <your-project-name>
✔ Where should we create your project?
  (leave blank to use current directory) … <your-project-name>
✔ Select a type: › Web
✔ Select a framework: › React
✔ Select a bundler: › Vite

Your project is ready!
```

If you are unsure about an option, simply choose Web, React and Vite. Once the project is created, follow the instructions to install dependencies and start the dev server:

```bash
cd <your-project-name>
npm install
npm run dev
```

You should now have your first Cpp.js project running!

When you are ready to ship your app to production, run the following:

```bash
npm run build
```

This will create a production-ready build of your app in the project's ./dist directory.
