import createBridgeFile from './createInterface.js';
import { createImportedBridges, findAppNativeImports } from './createImportedBridges.js';
import getDependFilePath from '../integration/getDependFilePath.js';
import state from '../state/index.js';
import findFiles from '../utils/findFiles.js';
import {
    boundHeaderSpecifiers, bridgeTargets, nodeBridgeTarget, resolveBoundHeaders,
} from '../utils/boundHeaders.js';

// The project's own headers, each with its bridge.
export function createBridges(target) {
    let headers = [];
    state.config.paths.header.forEach((headerPath) => {
        headers.push(findFiles('**/*.h', { cwd: headerPath }));
    });
    headers = headers.filter((path) => !!path.toString()).flat();

    return headers.map((header) => ({ file: header, bridge: createBridgeFile(header, target) }));
}

// The dependency headers the config binds whole, each read where one of the targets' packages ships it.
export function createBoundBridges(targets) {
    const headers = resolveBoundHeaders(boundHeaderSpecifiers(state.config), bridgeTargets(targets, state.targets), getDependFilePath);
    const wholeHeaders = headers.map((header) => header.file);
    return headers.map((header) => ({ ...header, bridge: createBridgeFile(header.file, header.target, { wholeHeaders }) }));
}

// What a native binary binds, an addon or an app host: the project's headers, the dependency headers the config binds
// whole, and the ones the app's sources import.
export function createNativeBridges(targets) {
    const boundHeaders = createBoundBridges(targets);
    const ownHeaders = [...createBridges(nodeBridgeTarget(targets)), ...boundHeaders];
    const imports = findAppNativeImports(bridgeTargets(targets, state.targets));
    return { headers: [...ownHeaders, ...createImportedBridges(ownHeaders, imports)], imports };
}
