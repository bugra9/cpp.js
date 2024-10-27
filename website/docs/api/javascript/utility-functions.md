# Utility Functions

| Function | Platform | Input | Output | Description |
| -------- | -------- | ----- | ------ | ----------- |
| toArray  | all | std::vector object | array | Converts a std::vector object into a JavaScript array |
| toVector | all | std::vector class, array | std::vector object | Converts a JavaScript array into a std::vector object |

<br />

### Examples  
```js
const myArray = ['a', 'b'];
const nativeArray = Module.toVector(Module.VectorString, myArray);
const jsArray = Module.toArray(nativeArray);
```

<br />

:::info
**Browser Functions:** You can access the browser functions from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cpp.js/src/assets/browser.js).  
**Node.js Functions:** You can access the Node.js functions from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cpp.js/src/assets/node.js).  
**React Native Functions:** You can access the React Native functions from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-core-embind-jsi/js/embind.js).
:::
