import { CodeWindow, primaryButtonStyle, secondaryButtonStyle } from '../components/ui.jsx';
import { PLAYGROUND_URL } from '../data.js';
import { LOGIN_URL } from './client.js';

// The run controls and the console the playground and the tutorial share; useRunner.js holds their state.

const ERROR_STREAMS = new Set(['stderr', 'warn', 'error']);

export const linkButtonStyle = (tokens, color = tokens.accentText) => ({
    background: 'none', border: 'none', padding: 0, color, cursor: 'pointer', font: 'inherit',
});

function statusText(phase, session, prebuilt) {
    if (phase === 'loading') return 'Loading the prebuilt module…';
    if (phase === 'compiling') return 'Compiling on the playground server…';
    if (phase === 'running') return 'Running in your browser…';
    if (prebuilt) return 'Runs without a compile until you edit the C++.';
    if (!session) return 'Connecting…';
    if (session.error) return session.error;
    if (!session.enabled) return 'The playground is paused for now.';
    return `${session.remaining} of ${session.limit} compiles left today`;
}

// Signing in always returns to the playground page (tooling/cloud/worker/oauth.js), so a page elsewhere (`away`)
// sends the visitor there to do it.
function SignInLink({ tokens, away }) {
    return (
        <a href={away ? PLAYGROUND_URL : LOGIN_URL} className="tap-target" style={{ color: tokens.accentText, fontWeight: 500, textDecoration: 'none' }}>
            {away ? 'Sign in on the playground' : 'Sign in with GitHub'}
        </a>
    );
}

function Account({
    tokens, session, away, onSignOut, onDeleteAccount,
}) {
    if (!session || session.error) return null;
    const style = { display: 'inline-flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13, color: tokens.textDim, marginLeft: 'auto' };
    if (session.user) {
        return (
            <span style={style}>
                {`Signed in as ${session.user.name}`}
                <button type="button" onClick={onSignOut} className="tap-target" style={linkButtonStyle(tokens)}>Sign out</button>
                <button type="button" onClick={onDeleteAccount} className="tap-target" style={linkButtonStyle(tokens, tokens.textDim)}>Delete account</button>
            </span>
        );
    }
    if (!session.canSignIn) return null;
    return (
        <span style={style}>
            More compiles a day:
            <SignInLink tokens={tokens} away={away} />
        </span>
    );
}

export function Toolbar({
    tokens, phase, session, ready, prebuilt, away, onRun, onStop, onSignOut, onDeleteAccount, children,
}) {
    const button = { padding: '10px 20px', fontSize: 14, cursor: 'pointer' };
    const busy = { loading: 'Loading…', compiling: 'Compiling…' }[phase];
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            {children}
            {phase === 'running' ? (
                <button type="button" onClick={onStop} className="tap-target" style={{ ...secondaryButtonStyle(tokens), ...button }}>Stop</button>
            ) : (
                <button
                    type="button"
                    onClick={onRun}
                    disabled={!ready}
                    className="tap-target"
                    aria-keyshortcuts="Control+Enter Meta+Enter"
                    style={{ ...primaryButtonStyle(tokens), ...button, opacity: ready ? 1 : 0.55, cursor: ready ? 'pointer' : 'default' }}
                >
                    {busy ?? 'Run'}
                </button>
            )}
            <span aria-live="polite" style={{ fontSize: 13, color: tokens.textDim }}>{statusText(phase, session, prebuilt)}</span>
            <Account tokens={tokens} session={session} away={away} onSignOut={onSignOut} onDeleteAccount={onDeleteAccount} />
        </div>
    );
}

export function Notice({
    tokens, notice, canSignIn, away,
}) {
    return (
        <div role="status" style={{ border: `1px solid ${tokens.borderStrong}`, borderRadius: 10, padding: '12px 16px', margin: '0 0 16px', fontSize: 14, color: tokens.text, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <span>{notice.text}</span>
            {notice.login && canSignIn && <SignInLink tokens={tokens} away={away} />}
        </div>
    );
}

export function Console({ tokens, lines, buildLog }) {
    return (
        <CodeWindow tokens={tokens} title="Console">
            <div aria-live="polite" style={{ minHeight: 140, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {buildLog && <div style={{ color: tokens.warn }}>{buildLog}</div>}
                {/* Lines only ever append, so the index is a stable key. */}
                {lines.map((line, index) => (
                    <div key={index} style={{ color: ERROR_STREAMS.has(line.stream) ? tokens.warn : tokens.codeText }}>{line.text}</div>
                ))}
                {!buildLog && lines.length === 0 && <span style={{ color: tokens.codeMuted }}>Press Run, or Ctrl+Enter, to run main.js.</span>}
            </div>
        </CodeWindow>
    );
}
