# Post Install
```bash
Usage: cpp.js postinstall [options]

prepare the required packages for Cpp.js after installation

Options:
  -h, --help  display help for command
```

<br />

Here is a minimal example:

```json title="package.json"
{
    "name": "mylib",
    "scripts": {
       "postinstall": "cpp.js postinstall"
    }
}
```
