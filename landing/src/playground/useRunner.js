import { useEffect, useRef, useState } from 'react';
import {
    deleteAccount, fetchSession, requestCompile, signOut, turnstileToken,
} from './client.js';
import { hasPrebuilt, loadPrebuilt } from './prebuilt.js';
import { runInSandbox } from './sandbox.js';

const MAX_LINES = 500;
const UNREACHABLE = 'The playground service cannot be reached right now.';
const DELETE_QUESTION = 'Delete your crossbind cloud account? This signs you out here and on every machine where crossbind login used it.';
const FAILURE_NOTICES = Object.freeze({
    compile: 'The build failed; its log is in the console.',
    timeout: 'The compile ran out of time.',
    memory: 'The compile ran out of memory.',
    output: 'The build printed too much or left no module.',
});

// Whether the C++ is still the sample's own, so its prebuilt module can stand in for a compile.
export const isPristine = (sources, original) => sources['native.h'] === original['native.h'] && sources['native.cpp'] === original['native.cpp'];

export const canRunPrebuilt = (sampleId, sources, original) => isPristine(sources, original) && hasPrebuilt(sampleId);

// Runs a sample's main.js in the sandboxed frame (sandbox.js) against a module: the prebuilt one while the C++ is
// unedited, otherwise one the playground server compiles. Also holds the session that compiles count against, which
// a `lazy` page asks the server for only once it calls `connect`, when its C++ first needs a compile.
export function useRunner({ lazy = false } = {}) {
    const [session, setSession] = useState(null);
    const [phase, setPhase] = useState('idle');
    const [notice, setNotice] = useState(null);
    const [lines, setLines] = useState([]);
    const [buildLog, setBuildLog] = useState('');
    const check = useRef(null);
    const stopRun = useRef(null);
    const connected = useRef(false);
    const reloadSession = () => fetchSession().then(setSession, () => setSession({ error: UNREACHABLE }));
    const print = (line) => setLines((current) => [...current.slice(-(MAX_LINES - 1)), line]);
    const canCompile = Boolean(session) && !session.error && session.enabled;

    function connect() {
        if (connected.current) return;
        connected.current = true;
        reloadSession();
    }

    useEffect(() => {
        if (!lazy) connect();
    }, []);

    function clear() {
        setLines([]);
        setBuildLog('');
        setNotice(null);
    }

    async function compile(sources) {
        const turnstile = session.user ? undefined : await turnstileToken(check.current, session.turnstileSiteKey);
        const result = await requestCompile({ 'native.h': sources['native.h'], 'native.cpp': sources['native.cpp'] }, turnstile);
        if (typeof result.remaining === 'number') setSession((current) => ({ ...current, remaining: result.remaining }));
        if (result.status !== 200) {
            setNotice({ text: result.error ?? `The playground answered ${result.status}.`, login: Boolean(result.login) });
            return null;
        }
        if (!result.ok) {
            setBuildLog(result.log ?? '');
            setNotice({ text: FAILURE_NOTICES[result.reason] ?? 'The build failed.' });
            return null;
        }
        return result;
    }

    async function run({ sampleId, sources, original }) {
        const prebuilt = canRunPrebuilt(sampleId, sources, original);
        if (phase !== 'idle' || !(prebuilt || canCompile)) return;
        clear();
        setPhase(prebuilt ? 'loading' : 'compiling');
        try {
            const module = prebuilt ? await loadPrebuilt(sampleId) : await compile(sources);
            if (!module) return;
            setPhase('running');
            const runner = runInSandbox({ js: module.js, wasm: module.wasm, code: sources['main.js'], onOutput: print });
            stopRun.current = runner.stop;
            await runner.done;
        } catch (error) {
            setNotice({ text: error.message || UNREACHABLE });
        } finally {
            stopRun.current = null;
            setPhase('idle');
        }
    }

    async function leave() {
        await signOut().catch(() => undefined);
        reloadSession();
    }

    async function removeAccount() {
        if (!window.confirm(DELETE_QUESTION)) return;
        const response = await deleteAccount().catch(() => null);
        setNotice({ text: response?.ok ? 'Your crossbind cloud account is deleted, and every machine is signed out of it.' : 'The account could not be deleted; try again.' });
        reloadSession();
    }

    return {
        session, phase, notice, setNotice, lines, buildLog, check, canCompile, connect, run, clear, stop: () => stopRun.current?.(), leave, removeAccount,
    };
}
