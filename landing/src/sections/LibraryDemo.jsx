import { useState } from 'react';
import { CodeWindow, highlight, primaryButtonStyle } from '../components/ui.jsx';
import { REPO_URL } from '../data.js';
import { isLive, liveDemo, loadDemo } from '../live/runtime.js';
import { createStatement, DEFAULT_QUERY, insertStatement, toTable } from '../live/sqlite.js';

// The page's one real-library demo: SQLite compiled from the published port, booted in the
// visitor's browser and queried against this site's own catalog. Everything is click-gated - the
// artifact is over a megabyte, so it must never touch a first paint.

const DEMO_ID = 'panel-sqlite';
const SOURCE_URL = `${REPO_URL}/blob/main/landing/demos/panel-sqlite/src/native/database.h`;

const WRAPPER = `#include <sqlite3.h>

class Database {
public:
    Database() { sqlite3_open(":memory:", &handle); }
    ~Database() { sqlite3_close(handle); }

    void exec(const std::string& sql);
    std::string query(const std::string& sql);

private:
    sqlite3* handle = nullptr;
};`;

const USAGE = `import { initNative, Database } from './native/database.h';

await initNative();
const db = await new Database();

await db.exec(catalogAsSql);
const rows = await db.query(yourQuery);`;

const megabytes = (bytes) => `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;

function statusText(state, bytes) {
    if (!state.db) return `The first run downloads ${megabytes(bytes)} of WebAssembly.`;
    if (!state.table) return `SQLite ${state.version}`;
    const count = state.table.rows.length;
    return `SQLite ${state.version} · ${count} ${count === 1 ? 'row' : 'rows'} in ${state.ms} ms`;
}

// The highlighter emits one div per line, so the indentation only survives with `pre`.
function Source({ tokens, title, code }) {
    return (
        <CodeWindow tokens={tokens} title={title}>
            <div style={{ whiteSpace: 'pre' }}>{highlight(code, tokens)}</div>
        </CodeWindow>
    );
}

function Results({ tokens, state }) {
    if (state.status === 'failed') {
        return <div style={{ marginTop: 20, fontFamily: tokens.mono, fontSize: 12.5, color: tokens.warn, lineHeight: 1.6 }}>{state.message}</div>;
    }
    if (!state.table?.columns.length) return null;
    return (
        <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                    <tr>
                        {state.table.columns.map((column) => (
                            <th
                                key={column}
                                style={{
                                    textAlign: 'left',
                                    fontFamily: tokens.mono,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    letterSpacing: 0.6,
                                    color: tokens.textMuted,
                                    borderBottom: `1px solid ${tokens.borderStrong}`,
                                    padding: '7px 14px 7px 0',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {state.table.rows.map((row) => (
                        <tr key={row.join('|')}>
                            {row.map((cell, index) => (
                                <td
                                    key={`${index}-${cell}`}
                                    style={{
                                        padding: '7px 14px 7px 0',
                                        borderBottom: `1px solid ${tokens.border}`,
                                        color: tokens.textDim,
                                        verticalAlign: 'top',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function LibraryDemo({ tokens }) {
    const demo = liveDemo(DEMO_ID);
    const [sql, setSql] = useState(DEFAULT_QUERY);
    const [state, setState] = useState({ status: 'idle' });

    if (!isLive(DEMO_ID)) return null;

    const run = async () => {
        setState((current) => ({ ...current, status: 'running' }));
        let { db, version } = state;
        try {
            if (!db) {
                const module = await loadDemo(DEMO_ID);
                const fresh = await new module.Database();
                await fresh.exec(createStatement());
                await fresh.exec(insertStatement());
                version = await fresh.version();
                db = fresh;
            }
            const started = performance.now();
            const table = toTable(await db.query(sql));
            setState({ status: 'ready', db, version, table, ms: Math.round((performance.now() - started) * 100) / 100 });
        } catch (error) {
            setState({ status: 'failed', db, version, table: null, message: error?.message ?? String(error) });
        }
    };

    const busy = state.status === 'running';

    return (
        <section style={{ padding: '80px var(--content-x) 80px' }}>
            <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 36, margin: '0 0 12px', fontWeight: 600, letterSpacing: -1, color: tokens.text }}>
                    Query a real C library, here.
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: tokens.textDim, margin: 0, maxWidth: 640 }}>
                    This page boots the published SQLite port, seeds an in-memory database with its own library catalog and runs
                    whatever you type. No server answers these queries.
                </p>
            </div>

            <div className="demo-code">
                <Source
                    tokens={tokens}
                    code={WRAPPER}
                    title={(
                        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            src/native/database.h
                            <a href={SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: tokens.accentText }}>
                                Full source ↗
                            </a>
                        </span>
                    )}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
                    <Source tokens={tokens} title="src/main.js" code={USAGE} />
                    <CodeWindow tokens={tokens} title="SQL" padded={false}>
                        <textarea
                            className="demo-query"
                            value={sql}
                            onChange={(event) => setSql(event.target.value)}
                            spellCheck="false"
                            aria-label="SQL to run against the library catalog"
                            rows={DEFAULT_QUERY.split('\n').length}
                            style={{
                                display: 'block',
                                width: '100%',
                                resize: 'vertical',
                                background: 'transparent',
                                color: tokens.codeText,
                                border: 'none',
                                padding: 18,
                                fontFamily: tokens.mono,
                                fontSize: 13,
                                lineHeight: 1.7,
                            }}
                        />
                    </CodeWindow>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, marginTop: 16 }}>
                <button
                    type="button"
                    className="tap-target"
                    onClick={run}
                    disabled={busy}
                    style={{ ...primaryButtonStyle(tokens), padding: '10px 20px', fontSize: 14, cursor: busy ? 'progress' : 'pointer' }}
                >
                    {busy ? 'Running…' : 'Run'}
                </button>
                <span aria-live="polite" style={{ fontSize: 13, color: tokens.textDim }}>
                    {statusText(state, demo.bytes ?? 0)}
                </span>
            </div>

            <Results tokens={tokens} state={state} />
        </section>
    );
}
