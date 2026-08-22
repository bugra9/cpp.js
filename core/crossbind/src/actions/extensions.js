import state from '../state/index.js';

export default function triggerExtensions(fileName, hook, params = []) {
    state.config.extensions?.forEach(e => {
        e?.[fileName]?.[hook](state, ...params);
    });
}
