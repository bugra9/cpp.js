import logUpdate from 'log-update';
import pc from 'picocolors';

const isTTY = !!process.stdout.isTTY;

let active = null;

function ms(n) {
    if (n == null) return '';
    return n < 1000 ? `${Math.round(n)}ms` : `${(n / 1000).toFixed(1)}s`;
}

function colorTime(rawMs) {
    const text = ms(rawMs);
    if (rawMs < 1000) return pc.green(text);
    if (rawMs < 5000) return pc.yellow(text);
    return pc.red(text);
}

function fmtLabel(target, fileType) {
    const path = pc.dim(target?.path || '');
    const env = target?.runtimeEnv ? pc.dim('/') + pc.cyan(target.runtimeEnv) : '';
    const ft = fileType ? ` ${pc.magenta(fileType)}` : '';
    return `${path}${env}${ft}`;
}

function commit(text) {
    if (isTTY) {
        logUpdate(text);
        logUpdate.done();
    } else {
        process.stdout.write(`${text}\n`);
    }
    active = null;
}

function show(text) {
    if (isTTY) {
        logUpdate(text);
    } else {
        process.stdout.write(`${text}\n`);
    }
}

export function startStep(target, fileType) {
    const label = fmtLabel(target, fileType);
    active = { label, startedAt: Date.now() };
    show(`${label}  ${pc.yellow('compiling...')}`);
}

export function doneStep(target, fileType, detail) {
    const label = fmtLabel(target, fileType);
    if (active && active.label === label) {
        const total = Date.now() - active.startedAt;
        const det = detail ? pc.dim(`  (${detail})`) : '';
        commit(`${label}  ${colorTime(total)}${det}`);
    } else {
        commit(`${label}  ${pc.green(detail || 'done')}`);
    }
}

export function cachedStep(target, fileType) {
    commit(`${fmtLabel(target, fileType)}  ${pc.gray('cached')}`);
}

export function startTask(label) {
    const styled = pc.magenta(label);
    active = { label: styled, startedAt: Date.now() };
    show(`${styled}  ${pc.yellow('working...')}`);
}

export function doneTask(label, detail) {
    const styled = pc.magenta(label);
    if (active && active.label === styled) {
        const total = Date.now() - active.startedAt;
        const det = detail ? pc.dim(`  (${detail})`) : '';
        commit(`${styled}  ${colorTime(total)}${det}`);
    } else {
        commit(`${styled}  ${pc.green(detail || 'done')}`);
    }
}

export function cachedTask(label) {
    commit(`${pc.magenta(label)}  ${pc.gray('cached')}`);
}

export function info(text) {
    if (active && isTTY) {
        logUpdate.done();
        active = null;
    }
    process.stdout.write(`${text}\n`);
}

export function error(text) {
    if (active && isTTY) {
        logUpdate.done();
        active = null;
    }
    process.stderr.write(`${pc.red(text)}\n`);
}

process.on('SIGINT', () => {
    if (active && isTTY) logUpdate.done();
    process.exit(130);
});

export default {
    startStep, doneStep, cachedStep, startTask, doneTask, cachedTask, info, error,
};
