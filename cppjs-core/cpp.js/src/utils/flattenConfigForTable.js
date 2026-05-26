const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Object maps with at least this many object-valued entries (e.g. allDependencyPaths,
// keyed per target) collapse to their key list instead of exploding into rows.
const LARGE_MAP_MIN_KEYS = 8;

function relativizePath(value, base) {
    if (base && typeof value === 'string' && value.startsWith(`${base}/`)) {
        return value.slice(base.length + 1);
    }
    return value;
}

function truncateMiddle(value, max) {
    if (typeof value !== 'string' || value.length <= max) return value;
    const head = Math.ceil((max - 1) / 2);
    const tail = Math.floor((max - 1) / 2);
    return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
}

function formatScalar(value, base, maxLen) {
    if (typeof value === 'function') return '[Function]';
    if (typeof value === 'string') return truncateMiddle(relativizePath(value, base), maxLen);
    return value;
}

// Flattens a resolved cpp.js config into a { 'dotted.key': displayValue } map so
// console.table renders a readable two-column view instead of one column per
// nested sub-key. Paths are shown relative to base and long values truncated in
// the middle; dependency arrays collapse to names, large per-target maps collapse
// to their keys, and other structures recurse with dotted/indexed keys.
export default function flattenConfigForTable(config, { base = null, maxDepth = 5, maxValueLength = 80 } = {}) {
    const out = {};

    const walk = (value, prefix, depth) => {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                out[prefix] = '[]';
            } else if (value.every((v) => v === null || typeof v !== 'object')) {
                out[prefix] = truncateMiddle(value.map((v) => relativizePath(v, base)).join(', '), maxValueLength);
            } else {
                const names = value.map((v) => v?.general?.name ?? v?.package?.name).filter(Boolean);
                if (names.length === value.length) {
                    out[prefix] = names.join(', ');
                } else if (depth <= 0) {
                    out[prefix] = `<${value.length} items>`;
                } else {
                    value.forEach((v, i) => walk(v, `${prefix}.${i}`, depth - 1));
                }
            }
            return;
        }

        if (!isPlainObject(value)) {
            out[prefix] = formatScalar(value, base, maxValueLength);
            return;
        }

        const keys = Object.keys(value);
        const isLargeObjectMap = prefix !== '' && keys.length >= LARGE_MAP_MIN_KEYS
            && keys.every((k) => isPlainObject(value[k]));
        if (keys.length === 0) {
            out[prefix] = '{}';
        } else if (isLargeObjectMap) {
            out[prefix] = truncateMiddle(keys.join(', '), maxValueLength);
        } else if (depth <= 0) {
            out[prefix] = '{…}';
        } else {
            keys.forEach((k) => walk(value[k], prefix ? `${prefix}.${k}` : k, depth - 1));
        }
    };

    walk(config, '', maxDepth);
    return out;
}
