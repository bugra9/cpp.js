// The playground's two looks. A visitor's own choice is stored; ?skin=, which the hero's Run link carries, shows a
// look for that visit alone. index.html's pre-paint script mirrors readSkin, so a Turbo visitor never sees the modern
// look first. No Vite-only imports, so the tests can load this file.

const SKINS = Object.freeze(['modern', 'turbo']);
export const SKIN_KEY = 'crossbind.playground.skin';
export const SKIN_PARAM = 'skin';

const isSkin = (value) => SKINS.includes(value);

// Storage is reached inside the try: with site data blocked, merely reading `localStorage` throws.
export function readSkin(search, storage = () => globalThis.localStorage) {
    const linked = new URLSearchParams(search).get(SKIN_PARAM);
    if (isSkin(linked)) return linked;
    try {
        const stored = storage()?.getItem(SKIN_KEY);
        return isSkin(stored) ? stored : SKINS[0];
    } catch {
        return SKINS[0];
    }
}

export function storeSkin(skin) {
    try {
        localStorage.setItem(SKIN_KEY, skin);
    } catch {
        // Not stored; this visit keeps the look.
    }
}
