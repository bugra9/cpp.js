import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Prerequisites
To begin building your project with Cpp.js, you’ll first need to install a few dependencies:

- **Docker**
- **Node.js** version 18 or higher
- **CMake** version 3.28 or higher (only required for Mobile development)
- **Xcode** (only required for iOS development)
- **Cocoapods** (only required for iOS development)

### Docker
The Docker image includes all the necessary requirements for both Web and Android applications.

Check the current Docker version with the following command:
```shell
docker --version
```
If you do not have Docker installed in current environment, you can use the following link to install it.

<Tabs>
  <TabItem value="apple" label="MacOS" default>
    - [Install Docker Desktop on Mac](https://docs.docker.com/desktop/install/mac-install/)
  </TabItem>
  <TabItem value="orange" label="Linux">
    - [Install Docker Desktop on Linux](https://docs.docker.com/desktop/install/linux-install/)
  </TabItem>
  <TabItem value="banana" label="Windows">
    - [Install Docker Desktop on Windows](https://docs.docker.com/desktop/install/windows-install/)
  </TabItem>
</Tabs>

:::tip
To download the cpp.js Docker image, use the command below. If you choose not to download it manually, cpp.js will automatically download the image during the first build process.
```shell
docker pull bugra9/cpp.js
```
:::

### Node.js
Check the current Node.js version with the following command:
```shell
node --version
```
If you do not have Node.js installed in current environment, or the installed version is too low, you can use the following link to install it.

- [Install Node.js](https://nodejs.org/en/download/package-manager)

:::warning
During iOS development, Xcode checks for Node.js in the system environment. If Node.js is not defined in the system environment, set it using the following command:

```shell
ln -s $(which node) /usr/local/bin/node
```
:::

### Cmake [Mobile Only]
Check the current CMake version with the following command:
```shell
cmake --version
```
If you do not have CMake installed in current environment, or the installed version is too low, you can use the following link to install it.

- [Install Cmake](https://cmake.org/download/)

### XCode [iOS Only]
:::warning[MacOS Only!]
iOS development requires Xcode and is only available on macOS.
:::
- [Install XCode](https://apps.apple.com/us/app/xcode/id497799835)


### Cocoapods [iOS Only]
:::warning[MacOS Only!]
iOS development requires XCode and is only available on macOS.
:::

Check the current Cocoapods version with the following command:
```shell
pod --version
```

If you do not have Cocoapods installed in current environment, you can use the following link to install it.

**Install Homebrew:**
```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Install Cocoapods using Homebrew:**
```shell
brew install cocoapods
```
