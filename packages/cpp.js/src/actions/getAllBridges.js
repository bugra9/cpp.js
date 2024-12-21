import findFiles from '../utils/findFiles.js';
import state from '../state/index.js';

export default function getAllBridges() {
    return [
        ...findFiles(`${state.config.paths.build}/bridge/*.i.cpp`),
    ];
}
