# @cpp.js/sample-mobile-reactnative-cli
**Cpp.js React Native sample**  

<a href="https://www.npmjs.com/package/@cpp.js/sample-mobile-reactnative-cli">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/sample-mobile-reactnative-cli?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>
<a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/react-native">
    <img alt="Docs - React Native" src="https://img.shields.io/badge/Docs_-_React%20Native-20B2AA?style=for-the-badge" />
</a>

# Getting Started

>**Note**: Make sure you have completed the [Cpp.js - Prerequisites](https://cpp.js.org/docs/guide/getting-started/prerequisites) instructions.

## Step 1: Install dependencies

```bash
npm install
cd ios
pod install
cd ..
```

## Step 2: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
npm start
```

## Step 3: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
npm run android
```

### For iOS

```bash
npm run ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.
