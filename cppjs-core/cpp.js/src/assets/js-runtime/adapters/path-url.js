export default {
    finalizePath(output) {
        if (output.substring(0, 4) !== 'http' && output[0] !== '/') {
            return `/${output}`;
        }
        return output;
    },
};
