# React Native

:::info
This guide is intended for react native projects that utilize @react-native-community/cli without a framework. Visit the [Expo page](expo) for a guide on using Expo.
:::

To integrate cpp.js into your project using React Native, you can utilize the cppjs-plugin-react-native, cppjs-plugin-react-native-ios-helper and cppjs-core-rn-embind. Start by installing these package with the following command:

```shell npm2yarn
npm install cpp.js cppjs-plugin-react-native cppjs-plugin-react-native-ios-helper cppjs-core-rn-embind
```

To enable the plugin, modify the `metro.config.js` file as shown below.

```diff title="metro.config.js"
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
+const CppjsMetroPlugin = require('cppjs-plugin-react-native/metro-plugin.cjs');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
-const config = {};
+const config = {
+    ...CppjsMetroPlugin(getDefaultConfig(__dirname)),
+};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

Cpp.js requires a configuration file to work. For a minimal setup, create a `cppjs.config.mjs` file and add the following content.

```js title="cppjs.config.mjs"
import getDirName from 'cpp.js/src/utils/getDirName.js';

export default {
    paths: {
        project: getDirName(import.meta.url),
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

#endif
```

Modify the React file to call the c++ function from your React page. For example;

```diff title="src/App.tsx"
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, View} from 'react-native';

+import './native/MySampleClass.h';
+import { initCppJs } from 'cpp.js';

function App(): React.JSX.Element {
+  const [message, setMessage] = useState('compiling ...');

+  useEffect(() => {
+    initCppJs().then(({ MySampleClass }) => {
+        setMessage(MySampleClass.sample());
+    });
+  }, []);

  return (
      <View>
+        <Text>Response from c++ : {message}</Text>
      </View>
  );
}

export default App;
```

The project is now fully set up and ready to run.

:::warning
Before proceeding, ensure that you have met all the [prerequisites](/docs/Guide/Getting%20Started/prerequisites) for setting up a working development environment.
:::

### Run on iOS
To install cocoapods packages, run the following command:

```shell
cd ios
pod install
```

You can now run the app on iOS using the following command:

```shell npm2yarn
npm run ios
```

### Run on Android

You can now run the app on Android using the following command:

```shell npm2yarn
npm run android
```

:::info
**Sample Source Code:** You can access the sample source code from [this link](https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-mobile-reactnative-nativecli).
:::
