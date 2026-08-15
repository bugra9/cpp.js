# Expo
To proceed with incorporating custom native code, you need to transition from Expo Go to a development build. This is necessary because Expo Go only supports libraries included in the Expo SDK or those without custom native code.

If your project does not currently include the 'ios' and 'android' directories, you can create them by executing the following command in your project directory:

```shell
npx expo prebuild
npx expo customize metro.config.js
```
This creates the android and ios directories for running your React code.

To integrate cpp.js into your project using React Native, you can utilize the @cpp.js/plugin-react-native, @cpp.js/plugin-react-native-ios-helper. Start by installing these package with the following command:

```shell npm2yarn
npm install @cpp.js/plugin-react-native @cpp.js/plugin-react-native-ios-helper
npm install -D @cpp.js/plugin-metro
```

`@cpp.js/plugin-react-native` stays in `dependencies` — Expo resolves it as a config plugin from `app.json`. The metro plugin only runs while bundling, so it belongs in `devDependencies`. Do not add `cpp.js` itself — the react native plugin brings the toolchain it was built against, and a second pin can drift from it.

To enable the plugin, modify the `metro.config.js` file as shown below.

```diff title="metro.config.js"
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
+const { mergeConfig } = require('metro-config');
+const CppjsMetroPlugin = require('@cpp.js/plugin-metro/metro-plugin.cjs');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

+const newConfig = {
+    ...CppjsMetroPlugin(config),
+};

-module.exports = config;
+module.exports = mergeConfig(config, newConfig);
```

`@cpp.js/plugin-react-native` also ships an Expo config plugin that wires the native build during `expo prebuild`. Add it to `plugins` in `app.json`.

```diff title="app.json"
 {
   "expo": {
     "plugins": [
       "expo-router",
+      "@cpp.js/plugin-react-native"
     ]
   }
 }
```

Cpp.js requires a configuration file to work. For a minimal setup, create a `cppjs.config.mjs` file and add the following content.

```js title="cppjs.config.mjs"
export default {
    paths: {
        config: import.meta.url,
    },
};
```

Move your C++ code to the src/native directory. For example;

```cpp title="src/native/MySampleClass.h"
#pragma once
#include <string>

class MySampleClass {
public:
    static std::string sample() {
        return "Hello World!";
    }
};
```

Modify the React file to call the c++ function from your React page. For example;

```diff title="src/app/index.tsx"
+import { useState, useEffect } from 'react';
+import { initNative, MySampleClass } from '@/native/MySampleClass.h';

export default function HomeScreen() {
+  const [message, setMessage] = useState('compiling ...');

+  useEffect(() => {
+    initNative().then(() => {
+        setMessage(MySampleClass.sample());
+    });
+  }, []);

  return (
      <ThemedView style={styles.titleContainer}>
-       <ThemedText type="title">Welcome!</ThemedText>
+       <ThemedText type="title">Response from c++ : {message}</ThemedText>
      </ThemedView>
  );
}
```

The project is now fully set up and ready to run.

:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/guide/getting-started/prerequisites) for setting up a working development environment.
:::

### Run on iOS
You can run the app on iOS using the following command:

```shell npm2yarn
npm run ios
```

### Run on Android
You can run the app on Android using the following command:

```shell npm2yarn
npm run android
```

:::info
**Sample Source Code:** You can access the sample source code from [this link](https://github.com/bugra9/cpp.js/tree/main/cppjs-samples/cppjs-sample-mobile-reactnative-expo).
:::
