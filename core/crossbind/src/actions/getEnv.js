import state from '../state/index.js';
import getData from './getData.js';

export default function getEnv(target) {
    return Object.fromEntries(Object.entries(getData('env', target))
        .map(([key, value]) => [key, typeof value === 'function' ? value(state, target) : value]));
}
