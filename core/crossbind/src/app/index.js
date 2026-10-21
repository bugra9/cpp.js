// What an app's host does for its page: the dialogs that pick files, opening an address or a file outside the app, the
// app's folders and quitting. Each call goes to the host of an app (target.runtimeEnv: 'app'); in any other build it
// rejects. The app's native code calls the same through <crossbind/app.h>.

const OPEN = { title: 'string', defaultPath: 'string', filters: 'filters', directory: 'boolean', multiple: 'boolean' };
const SAVE = { title: 'string', defaultPath: 'string', defaultName: 'string', filters: 'filters' };

// The app's crossbind.js, which initNative() loads, hands the calls to the host.
function call(name, options) {
    const host = globalThis.Crossbind?.app;
    if (host) return host(name, options);
    if (globalThis.Crossbind) throw new Error(`crossbind: this app's host is older than crossbind/app; update @crossbind/core-app-host to call ${name}`);
    if (globalThis.__crossbind_token) throw new Error(`crossbind: ${name} works once the page has called initNative()`);
    throw new Error(`crossbind: ${name} works in an app alone, whose crossbind.config.js sets target.runtimeEnv: 'app'`);
}

const isFilters = (value) => Array.isArray(value) && value.every((filter) => typeof filter?.name === 'string'
    && Array.isArray(filter.extensions) && filter.extensions.every((extension) => typeof extension === 'string'));

// The options as the host takes them, so a misspelt or mistyped one fails here, saying which.
function checked(name, options, kinds) {
    const keys = Object.keys(kinds).join(', ');
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError(`crossbind: ${name} takes an object of ${keys}.`);
    }
    for (const [key, value] of Object.entries(options)) {
        if (!Object.hasOwn(kinds, key)) throw new TypeError(`crossbind: ${name} takes ${keys}; ${key} is none of them.`);
        const isFitting = kinds[key] === 'filters' ? isFilters(value) : typeof value === kinds[key];
        if (value !== undefined && !isFitting) {
            throw new TypeError(`crossbind: ${name}'s ${key} is no ${kinds[key] === 'filters' ? 'list of { name, extensions }' : kinds[key]}.`);
        }
    }
    return options;
}

function checkedPath(name, path) {
    if (typeof path !== 'string' || !path) throw new TypeError(`crossbind: ${name} takes a path.`);
    return { path };
}

export const dialog = {
    // The paths of the files or folders the user picked, or null when they cancelled.
    open: async (options = {}) => call('dialog.open', checked('dialog.open', options, OPEN)),
    // The path the user chose to save to, or null when they cancelled.
    save: async (options = {}) => call('dialog.save', checked('dialog.save', options, SAVE)),
};

export const shell = {
    // An http, https or mailto address in the default browser or mail app.
    openExternal: async (url) => {
        if (typeof url !== 'string' && !(url instanceof URL)) throw new TypeError('crossbind: shell.openExternal takes an address.');
        return call('shell.openExternal', { url: String(url) });
    },
    // A file in the app the system opens its kind with. Opening a program runs it, and a script in the page could ask for
    // any path, so the host opens files where app.openPath in crossbind.config.js lets it alone; native code opens any.
    openPath: async (path) => call('shell.openPath', checkedPath('shell.openPath', path)),
    // A file, selected, in the system's file manager: one in the app's folders, or one a dialog picked during this run.
    revealInFolder: async (path) => call('shell.revealInFolder', checkedPath('shell.revealInFolder', path)),
};

export const app = {
    // The app's own folders, made when first asked for: { data, cache, logs }.
    paths: async () => call('app.paths', {}),
    // Ends the app as closing its window does.
    quit: async () => call('app.quit', {}),
};
