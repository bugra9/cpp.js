# Overview
Cpp.js includes helper JavaScript functions to handle cross-platform differences and simplify usage. This document provides an overview of these functions.

<br />

<div className="flex flex-wrap gap-4">
    <div className="flex-1">
        **File System Functions**
        | Name | Platform |
        | ---- | -------- |
        | generateVirtualPath | browser |
        | unmount | browser |
        | autoMountFiles | browser |
        | getFileBytes | browser, node.js |
        | getFileList | browser, node.js |
    </div>
    <div className="flex-1">
        **Utility Functions**
        | Name | Platform |
        | ---- | -------- |
        | toArray  | all |
        | toVector | all |
    </div>
</div>

<br />

:::info
**Browser Functions:** You can access the browser functions from [this link](https://github.com/bugra9/cpp.js/blob/main/core/cppjs-core/src/assets/browser.js).  
**Node.js Functions:** You can access the Node.js functions from [this link](https://github.com/bugra9/cpp.js/blob/main/core/cppjs-core/src/assets/node.js).  
**React Native Functions:** You can access the React Native functions from [this link](https://github.com/bugra9/cpp.js/blob/main/core/cppjs-core-rn-embind/js/embind.js).
:::
