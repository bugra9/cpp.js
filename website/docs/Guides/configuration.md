---
sidebar_position: 1
---

# Configuration

To ensure proper functioning of cpp.js, some configurations are required. These configurations are set by default, but if the default values do not match the project requirements, you will need to customize them. In such a case, you can create a .cppjs.config.json file in the project directory and define the variables you want to overwrite. The default values for this file are as follows:

```json
{
    "general": {
        "name": "PACKAGE_JSON_NAME"
    },
    "paths": {
        "project": ".",
        "base": "PROJECT_PATH",
        "temp": "node_modules/.cppjs/RANDOM",
        "native": ["src/native"],
        "module": ["src/native"],
        "header": ["src/native"],
        "bridge": ["src/native", "TEMP_PATH"],
        "output": "TEMP_PATH",
        "cmake": "AUTO_FIND",
        "cli": "CLI_PATH"
    },
    "ext": {
        "header": ["h", "hpp", "hxx", "hh"],
        "source": ["c", "cpp", "cxx", "cc"],
        "module": ["i"]
    }
}
```

### Name
Project name

**Default value:** The value written in the name field in the package.json file.

### Project Path
The path where the project is located

**Default value:** ./

### Base Path
The top-level directory where the required code for compilation is located. This path is connected to docker and all other paths are expressed relative to this value. If the project needs a file that is located higher than the project path during compilation, this variable needs to be set. This is especially useful in monorepos. 

**Default value:** Project path value

### Temp Path
Temporary directory where the generated files will be saved.

**Default value:** node_modules/.cppjs/RANDOM

### Native Path
The path where the c/c++ files are located. The system starts searching this files recursively from this path.

**Default value:** ["src/native"]

### Module Path
The path where the swig interface files are located. The system starts searching this files recursively from this path.

**Default value:** ["src/native"]

### Header Path
The path where the header files are located. The system starts searching this files recursively from this path.

**Default value:** ["src/native"]

### Bridge Path
The path where the header files are located. The system starts searching this files recursively from this path.

**Default value:** ["src/native", "TEMP_PATH"]

### Output Path
The path where the generated library and wasm file will be saved.

**Default value:** TEMP_PATH

### Cmake Path
The parent path where the CmakeLists.txt file is located. If not specified, the system searches this file in the project path. If it still can't find it, the system uses the cpp.js CmakeLists.txt file.

**Default value:** AUTO_FIND

### CLI Path
The path where the cpp.js lib is located.

**Default value:** cpp.js lib path

### Header Extensions
Header file extensions.

**Default value:** ["h", "hpp", "hxx", "hh"]

### Source Extensions
Source file extensions.

**Default value:** ["c", "cpp", "cxx", "cc"]

### Module Extensions
Module file extensions.

**Default value:** ["i"]
