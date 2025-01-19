# Config
```bash
Usage: cppjs config [options] [command]

manage the Cpp.js configuration files

Options:
  -h, --help  display help for command

Commands:
  get             get the Cpp.js system configuration
  set             set the Cpp.js system configuration
  delete          delete the Cpp.js system configuration
  list [options]  list the Cpp.js configurations
  keys            list all available system configuration keys for Cpp.js
  help [command]  display help for command
```

<br />

Here is a minimal example for keys:
```shell
cppjs config keys
```
```bash
Available system keys:
┌────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┬──────────────┬──────────────────────────────────────────────┐
│ (index)                │ description                                                                                          │ default      │ options                                      │
├────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┼──────────────┼──────────────────────────────────────────────┤
│ XCODE_DEVELOPMENT_TEAM │ 'The unique identifier of the development team used for code signing and app distribution in Xcode.' │ ''           │                                              │
│ RUNNER                 │ 'The execution environment for running the application.'                                             │ 'DOCKER_RUN' │ [ 'DOCKER_RUN', 'DOCKER_EXEC', 'LOCAL' ]     │
│ LOG_LEVEL              │ 'The verbosity of log output.'                                                                       │ 'INFO'       │ [ 'DEBUG', 'INFO', 'WARN', 'ERROR' ]         │
└────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────┴──────────────┴──────────────────────────────────────────────┘
```

### List
```bash
Usage: cppjs config list [options]

list the Cpp.js configurations

Options:
  -t, --type <type>  config type (choices: "all", "system", "project", default: "system")
  -h, --help         display help for command
```

Here is a minimal example for list:
```shell
cppjs config list
```
```bash
System Configuration
┌────────────────────────┬──────────────┐
│ (index)                │ Values       │
├────────────────────────┼──────────────┤
│ XCODE_DEVELOPMENT_TEAM │ '7ZZLDWBUVT' │
│ RUNNER                 │ 'DOCKER_RUN' │
│ LOG_LEVEL              │ 'INFO'       │
└────────────────────────┴──────────────┘
```
