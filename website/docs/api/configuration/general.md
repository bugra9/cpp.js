# General
This object includes general configurations, such as the project name.

Here is a minimal example:
```js
export default {
    general: {
        name: 'sampleName',
    },
    paths: {
        config: import.meta.url,
    },
};
```

### Attributes

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| name | string | name attribute in package.json | Output file name |
