import glob from 'glob';
import state from '../state/index.js';

export default function getAllBridges() {
    return [
        ...glob.sync(`${state.config.paths.build}/bridge/*.i.cpp`, { absolute: true }),
    ];
}
