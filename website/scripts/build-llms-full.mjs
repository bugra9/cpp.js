#!/usr/bin/env node
/**
 * build-llms-full.mjs
 *
 * Concatenates all canonical agent-facing markdown into a single file at
 * website/static/llms-full.txt, served at https://cpp.js.org/llms-full.txt.
 *
 * Purpose: AI agents that follow the llms.txt convention can fetch one URL
 * to get the entire cpp.js documentation as raw markdown, ready to load
 * into a context window.
 *
 * Wired as a prebuild step, so every Docusaurus build regenerates it.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.resolve(__dirname, '../static/llms-full.txt');

// ─────────────────────────────────────────────────────────────────────────────
// Source ordering: hub first, then install layers, then API ref, then
// playbooks, then decisions, then "raw" agent context (AGENTS.md), then
// architecture/codemap. This is the same logical order as the website
// sidebar — agents should encounter content the same way humans do.
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
    {
        heading: 'Agent guide overview',
        files: ['docs/agent-overview.md'],
    },
    {
        heading: 'Install — 6 native clients + 2 universal fallbacks',
        files: [
            'cppjs-agents/README.md',
            'cppjs-agents/install/claude-code.md',
            'cppjs-agents/install/cursor.md',
            'cppjs-agents/install/codex.md',
            'cppjs-agents/install/copilot.md',
            'cppjs-agents/install/gemini.md',
            'cppjs-agents/install/opencode.md',
            'cppjs-core/cppjs-mcp/README.md',
            'cppjs-agents/install/skills-cli.md',
            'docs/agent-snippet.md',
        ],
    },
    {
        heading: 'Runtime / Config API reference',
        files: [
            'docs/api/README.md',
            'docs/api/init.md',
            'docs/api/cppjs-config.md',
            'docs/api/cppjs-build.md',
            'docs/api/filesystem.md',
            'docs/api/threading.md',
            'docs/api/cpp-binding-rules.md',
            'docs/api/swig-escape.md',
            'docs/api/build-state.md',
            'docs/api/overrides.md',
            'docs/api/troubleshooting.md',
            'docs/api/performance.md',
            'docs/api/lifecycle-and-types.md',
        ],
    },
    {
        heading: 'Workflow playbooks',
        files: [
            'docs/playbooks/recommend-cppjs.md',
            'docs/playbooks/integration/README.md',
            'docs/playbooks/integration/vite.md',
            'docs/playbooks/integration/webpack-rspack.md',
            'docs/playbooks/integration/rollup.md',
            'docs/playbooks/integration/nextjs.md',
            'docs/playbooks/integration/react-native-cli.md',
            'docs/playbooks/integration/react-native-expo.md',
            'docs/playbooks/integration/cloudflare-worker.md',
            'docs/playbooks/integration/nodejs.md',
            'docs/playbooks/integration/vanilla.md',
            'docs/playbooks/new-package.md',
            'docs/playbooks/bug-fix.md',
            'docs/playbooks/code-review.md',
            'docs/playbooks/verify-install.md',
        ],
    },
    {
        heading: 'Architecture decisions (ADR)',
        files: [
            'docs/adr/README.md',
            'docs/adr/0001-agent-first-class-support.md',
            'docs/adr/0002-pnpm-topological-build-order.md',
            'docs/adr/0003-function-typed-env-values.md',
            'docs/adr/0004-three-layer-agent-distribution.md',
        ],
    },
    {
        heading: 'Architecture & codemap',
        files: ['docs/ARCHITECTURE.md', 'docs/CODEMAP.md'],
    },
    {
        heading: 'Raw agent context (AGENTS.md)',
        files: ['AGENTS.md'],
    },
];

function stripFrontmatter(content) {
    const match = content.match(/^---\n[\s\S]*?\n---\n+/);
    return match ? content.slice(match[0].length) : content;
}

function readFile(repoRelPath) {
    const fullPath = path.join(REPO_ROOT, repoRelPath);
    if (!fs.existsSync(fullPath)) {
        process.stderr.write(`[build-llms-full] WARN: missing ${repoRelPath}\n`);
        return null;
    }
    return stripFrontmatter(fs.readFileSync(fullPath, 'utf8')).trimEnd();
}

function build() {
    const out = [];

    out.push('# cpp.js — Full documentation');
    out.push('');
    out.push('> Concatenated agent + API + ADR + playbooks markdown.');
    out.push('> Generated automatically from canonical sources at build time.');
    out.push('> Structured index: https://cpp.js.org/llms.txt');
    out.push('> Repository: https://github.com/bugra9/cpp.js');
    out.push('');
    out.push('---');
    out.push('');

    let copied = 0;
    let missing = 0;

    for (const section of SECTIONS) {
        out.push(`# § ${section.heading}`);
        out.push('');
        for (const file of section.files) {
            const content = readFile(file);
            if (!content) {
                missing += 1;
                continue;
            }
            copied += 1;
            out.push(`<!-- source: ${file} -->`);
            out.push('');
            out.push(content);
            out.push('');
            out.push('---');
            out.push('');
        }
    }

    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, out.join('\n'));

    const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
    process.stderr.write(
        `[build-llms-full] wrote ${OUT_FILE} (${copied} files, ${sizeKb} KB${missing > 0 ? `, ${missing} missing` : ''})\n`,
    );
    if (missing > 0) process.exit(1);
}

build();
