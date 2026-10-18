// What a Hermes runtime embedded without React Native lacks; the host functions come from host_core.cpp.
/* global __host_log, __host_timer */
const consoleObject = {};
for (const level of ['log', 'info', 'warn', 'error', 'debug']) {
    consoleObject[level] = (...args) => __host_log(level, args.map((arg) => (arg instanceof Error ? `${arg.message}\n${arg.stack}` : String(arg))).join(' '));
}
globalThis.console = consoleObject;

let nextTimer = 1;
const timers = new Map();
globalThis.setTimeout = (fn, ms = 0, ...args) => {
    const id = nextTimer;
    nextTimer += 1;
    timers.set(id, () => fn(...args));
    // As a browser reads the delay: a number from 0 up to 32 bits, 0 for anything else.
    __host_timer(id, Math.min(Math.max(Number(ms) || 0, 0), 2 ** 31 - 1));
    return id;
};
globalThis.clearTimeout = (id) => {
    timers.delete(id);
};
globalThis.__host_timer_fire = (id) => {
    const fn = timers.get(id);
    timers.delete(id);
    if (fn) fn();
};

if (typeof globalThis.queueMicrotask !== 'function') {
    globalThis.queueMicrotask = (fn) => {
        Promise.resolve().then(fn);
    };
}
