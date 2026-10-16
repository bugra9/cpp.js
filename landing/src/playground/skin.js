// The playground's two looks. It opens modern; the hero's Run link carries ?skin=turbo, which shows the Turbo C++ look
// for that visit alone, and nothing is stored. index.html's pre-paint script mirrors readSkin, so a Turbo visit never
// shows the modern look first. No Vite-only imports, so the tests can load this file.

const SKINS = Object.freeze(['modern', 'turbo']);
export const SKIN_PARAM = 'skin';

export function readSkin(search) {
    const linked = new URLSearchParams(search).get(SKIN_PARAM);
    return SKINS.includes(linked) ? linked : SKINS[0];
}
