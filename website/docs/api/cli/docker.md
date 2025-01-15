# Docker
```bash
Usage: cppjs docker [options] [command]

manage docker

Options:
  -h, --help  display help for command

Commands:
  run             run docker application
  create          create docker container
  start           start docker container
  stop            stop docker container
  delete          delete docker container
  help [command]  display help for command
```

<br />

The bugra9/cpp.js Docker image includes all the necessary tools for compiling to Web and Android using Cpp.js, such as Emscripten, Android SDK, Android NDK, JDK, SWIG, CMake, and SQLite3. To run an application within this Docker image, the command cpp.js run is used.

Here is a minimal example:

```shell
cppjs docker run -- cmake --version
```
```bash
cmake version 3.28.3

CMake suite maintained and supported by Kitware (kitware.com/cmake).
```

:::info
**Docker Image:** You can access the docker image from [this link](https://hub.docker.com/r/bugra9/cpp.js).  
**Dockerfile:** You can access the dockerfile from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-core-docker/Dockerfile).  
**Run Function:** You can access the run function from [this link](https://github.com/bugra9/cpp.js/blob/main/packages/cpp.js/src/functions/run.js).
:::
