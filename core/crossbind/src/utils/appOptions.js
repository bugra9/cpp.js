// The app section of crossbind.config.js: what a user sees of an app, its name and, on the desktop, its window, and where
// its page opens files.

const WINDOW_DEFAULTS = { width: 1024, height: 768, minWidth: 0, minHeight: 0, resizable: true };
// Larger than any display, and far within the int a host takes a size as.
const MAX_WINDOW_SIZE = 16384;
// Windows keeps each of a file version's four numbers in 16 bits.
const MAX_VERSION_NUMBER = 65535;
// Up to four numbers, then a semver prerelease or build part; none of its characters needs escaping in C or RC.
const WINDOWS_VERSION = /^(\d+(?:\.\d+){0,3})(?:[-+][0-9A-Za-z.+-]*)?$/;
// What app.openPath can let the page's shell.openPath open: the app's folders as app.paths() names them, and what a
// dialog picked during this run.
const OPEN_PATH_PLACES = ['data', 'cache', 'logs', 'picked'];

// An app's bundle id, which also names its folders on the desktop: app.id, else one made from the project's name.
export function appId(config) {
    const id = config.app.id ?? `dev.crossbind.${config.general.name.replace(/[^A-Za-z0-9.-]/g, '-')}`;
    // An empty part would let "." or ".." name the folder above the app's own.
    if (typeof id !== 'string' || !/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*$/.test(id)) {
        throw new Error(`crossbind: app.id ${JSON.stringify(id)} is no bundle id, which takes dot-separated parts of letters, digits and hyphens, as com.example.app does.`);
    }
    return id;
}

// The name the app shows: its window's title, its macOS menus, its Windows file description and the label under its
// icon. The project's name, without app.name.
export function appDisplayName(config) {
    const isOwn = config.app.name !== undefined;
    const name = isOwn ? config.app.name : config.general.name;
    // The host takes it as a C string and a Windows resource string, which hold none of these as they are, and Android
    // reads a label that starts with @ or ? as a resource.
    if (typeof name !== 'string' || !name.trim() || /["\\\p{Cc}]/u.test(name) || /^[@?]/.test(name)) {
        const rule = 'which is text without a quotation mark, a backslash or a control character, starting with neither @ nor ?';
        throw new Error(isOwn
            ? `crossbind: app.name ${JSON.stringify(name)} is no name an app can show, ${rule}. Change it, or drop app.name to show general.name.`
            : `crossbind: general.name ${JSON.stringify(name)}, which an app shows without app.name, is no name it can show, ${rule}. Set app.name in crossbind.config.js.`);
    }
    return name;
}

// The desktop window: the size of its page, the least it shrinks to and whether it resizes.
export function appWindow(config) {
    const window = config.app.window ?? {};
    const keys = Object.keys(WINDOW_DEFAULTS).join(', ');
    if (typeof window !== 'object' || Array.isArray(window)) {
        throw new Error(`crossbind: app.window ${JSON.stringify(window)} is no object of ${keys}, as { width: 1024, height: 768 } is.`);
    }
    const unknown = Object.keys(window).filter((key) => !(key in WINDOW_DEFAULTS));
    if (unknown.length > 0) throw new Error(`crossbind: app.window takes ${keys}; ${unknown.join(', ')} is none of them.`);
    const options = { ...WINDOW_DEFAULTS, ...window };
    ['width', 'height', 'minWidth', 'minHeight'].forEach((key) => {
        const least = key.startsWith('min') ? 0 : 1;
        if (!Number.isInteger(options[key]) || options[key] < least || options[key] > MAX_WINDOW_SIZE) {
            throw new Error(`crossbind: app.window.${key} ${JSON.stringify(options[key])} is no size, which is a whole number of pixels from ${least} to ${MAX_WINDOW_SIZE}.`);
        }
    });
    if (typeof options.resizable !== 'boolean') {
        throw new Error(`crossbind: app.window.resizable ${JSON.stringify(options.resizable)} is no boolean.`);
    }
    if (!options.resizable && (options.minWidth || options.minHeight)) {
        throw new Error('crossbind: app.window.minWidth and minHeight limit a window that resizes: drop them, or set app.window.resizable to true.');
    }
    if (options.minWidth > options.width) {
        throw new Error(`crossbind: app.window.minWidth ${options.minWidth} is above the width the window opens with, ${options.width}: lower it, or raise app.window.width.`);
    }
    if (options.minHeight > options.height) {
        throw new Error(`crossbind: app.window.minHeight ${options.minHeight} is above the height the window opens with, ${options.height}: lower it, or raise app.window.height.`);
    }
    return options;
}

// The version a Windows app's executable carries: package.json's, whose numbers are its file version.
function windowsVersion(config) {
    const version = config.package?.version ?? '1.0.0';
    const match = typeof version === 'string' ? WINDOWS_VERSION.exec(version) : null;
    const numbers = match ? match[1].split('.').map(Number) : [];
    if (!match || numbers.some((number) => number > MAX_VERSION_NUMBER)) {
        throw new Error(`crossbind: package.json's version ${JSON.stringify(version)} is no version a Windows app can carry, which is up to four numbers from 0 to ${MAX_VERSION_NUMBER}, as 1.2.3 and 1.2.3-beta.1 are.`);
    }
    return { text: version, numbers: [...numbers, 0, 0, 0].slice(0, 4).join(',') };
}

// Where the page's shell.openPath opens a file: nowhere unless app.openPath lists it, as opening a program runs it.
function appOpenPath(config) {
    const places = config.app.openPath ?? [];
    if (!Array.isArray(places)) {
        throw new Error(`crossbind: app.openPath ${JSON.stringify(places)} is no list of ${OPEN_PATH_PLACES.join(', ')}, as ['logs', 'picked'] is.`);
    }
    const unknown = places.filter((place) => !OPEN_PATH_PLACES.includes(place));
    if (unknown.length > 0) {
        throw new Error(`crossbind: app.openPath takes ${OPEN_PATH_PLACES.join(', ')}; ${unknown.map((place) => JSON.stringify(place)).join(', ')} is none of them.`);
    }
    return places;
}

// The header an app's host compiles where its page opens files from, a desktop host its title and window, and a Windows
// host its version resource.
export function appHeader(config, platform) {
    const comment = '// crossbind writes this file from crossbind.config.js and package.json.';
    const openPath = `#define CROSSBIND_APP_OPEN_PATH {${appOpenPath(config).map((place) => `"${place}"`).join(', ')}}`;
    if (!['darwin', 'linux', 'win32'].includes(platform)) return [comment, openPath, ''].join('\n');
    const window = appWindow(config);
    const lines = [
        comment,
        openPath,
        `#define CROSSBIND_APP_ID "${appId(config)}"`,
        `#define CROSSBIND_APP_NAME "${appDisplayName(config)}"`,
        `#define CROSSBIND_APP_WINDOW_WIDTH ${window.width}`,
        `#define CROSSBIND_APP_WINDOW_HEIGHT ${window.height}`,
        `#define CROSSBIND_APP_WINDOW_MIN_WIDTH ${window.minWidth}`,
        `#define CROSSBIND_APP_WINDOW_MIN_HEIGHT ${window.minHeight}`,
        `#define CROSSBIND_APP_WINDOW_RESIZABLE ${window.resizable ? 1 : 0}`,
    ];
    if (platform === 'win32') {
        const version = windowsVersion(config);
        lines.push(`#define CROSSBIND_APP_VERSION "${version.text}"`, `#define CROSSBIND_APP_VERSION_NUMBERS ${version.numbers}`);
    }
    return [...lines, ''].join('\n');
}
