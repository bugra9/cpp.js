---
sidebar_position: 3
---

# Create your first app
In this section, you will learn how to set up your Cpp.js project and write a minimal starter application. By the end of this section, you should be able to run a working Cpp.js app in development mode from your terminal.

```shell npm2yarn
npm init cpp.js@latest
```

This command will install and execute [create-cpp.js](https://github.com/bugra9/cpp.js/tree/main/packages/core-create-app), the official Cpp.js project scaffolding tool. You will be presented with prompts for several optional features such as React.

```bash
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

```shell npm2yarn
cd <your-project-name>
npm install
npm run dev
```

You should now have your first Cpp.js project running!

When you are ready to ship your app to production, run the following:

```shell npm2yarn
npm run build
```

This will create a production-ready build of your app in the project's ./dist directory. 
