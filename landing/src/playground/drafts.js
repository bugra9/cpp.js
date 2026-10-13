// Edits kept per sample in this browser, one storage key per page. A draft holds only the files that differ from its
// sample, so a later fix to a sample's other files still reaches whoever edited one of them. Every change is applied
// to what is stored at that moment rather than to the page's own copy, so two open tabs keep each other's drafts.
// Storage can be blocked, as in private windows; a page then starts from the samples. No Vite-only imports, so the
// tests can load this file.

const FILE_NAMES = Object.freeze(['native.h', 'native.cpp', 'main.js']);

const isObject = (value) => typeof value === 'object' && value !== null;

export const without = (object, key) => Object.fromEntries(Object.entries(object).filter(([name]) => name !== key));

// The files in `files` that differ from the sample's own `original`; empty when there are none.
export function overlayOf(files, original) {
    return Object.fromEntries(Object.entries(files).filter(([name, text]) => FILE_NAMES.includes(name) && typeof text === 'string' && text !== original[name]));
}

// What a stored value holds for `samples`: the drafts that still apply, each cut down to its edited files, and the
// sample shown last. A draft saved before there were samples is the first sample's three files.
export function parseDrafts(stored, samples) {
    const find = (id) => samples.find((sample) => sample.id === id);
    const legacy = isObject(stored) && FILE_NAMES.every((name) => typeof stored[name] === 'string');
    const store = legacy ? { sample: samples[0].id, drafts: { [samples[0].id]: stored } } : stored;
    const entries = Object.entries(isObject(store?.drafts) ? store.drafts : {}).flatMap(([id, draft]) => {
        const sample = find(id);
        const overlay = sample && isObject(draft) ? overlayOf(draft, sample.files) : {};
        return Object.keys(overlay).length ? [[id, overlay]] : [];
    });
    return { sample: find(store?.sample)?.id, drafts: Object.fromEntries(entries) };
}

export function readDrafts(storageKey, samples) {
    try {
        return parseDrafts(JSON.parse(localStorage.getItem(storageKey) ?? 'null'), samples);
    } catch {
        return { sample: undefined, drafts: {} };
    }
}

export function updateDrafts(storageKey, samples, change) {
    try {
        localStorage.setItem(storageKey, JSON.stringify(change(readDrafts(storageKey, samples))));
    } catch {
        // Not stored; the code stays on the page.
    }
}

// One file's new text applied to a sample's drafts: the draft keeps what still differs, and goes once nothing does.
export function editDraft(drafts, sample, name, text) {
    const overlay = overlayOf({ ...(drafts[sample.id] ?? {}), [name]: text }, sample.files);
    return Object.keys(overlay).length ? { ...drafts, [sample.id]: overlay } : without(drafts, sample.id);
}
