export default {
    general: {
        name: 'crossbind-example-cloud-cloudflare-worker',
    },
    paths: {
        config: import.meta.url,
        base: '../..', /* Delete this line for create-crossbind */
        output: 'dist',
    },
};
