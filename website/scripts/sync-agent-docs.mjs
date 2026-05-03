#!/usr/bin/env node
/**
 * sync-agent-docs.js
 *
 * Copies the canonical agent-facing markdown from the repo root + cpp.js MCP
 * package into website/docs/agent/, injecting Docusaurus frontmatter and
 * rewriting internal links so the Docusaurus build doesn't break.
 *
 * Single source of truth: docs/* + AGENTS.md + cppjs-core/cppjs-mcp/README.md.
 * website/docs/agent/ is regenerated every build (gitignored).
 *
 * Usage:
 *   node website/scripts/sync-agent-docs.js
 *
 * Wired as the website's `prebuild` script so `pnpm --filter @cpp.js/website build`
 * runs it automatically.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.resolve(__dirname, '../docs/agent');
const GITHUB_BASE = 'https://github.com/bugra9/cpp.js/blob/main';

// ─────────────────────────────────────────────────────────────────────────────
// File mapping: { src, dest, meta }
// dest is relative to website/docs/agent/.
// meta is the Docusaurus frontmatter to inject.
// ─────────────────────────────────────────────────────────────────────────────

const FILES = [
    // Overview — human-friendly landing (NOT the agent-facing AGENTS.md)
    {
        src: 'docs/agent-overview.md',
        dest: 'overview.md',
        meta: {
            id: 'overview',
            title: 'cpp.js for AI coding agents',
            sidebar_label: 'Overview',
            slug: '/agent/overview',
        },
    },

    // Reference: AGENTS.md (root) — the raw agent-context file the AI itself reads
    {
        src: 'AGENTS.md',
        dest: 'reference/agents-md.md',
        meta: {
            id: 'agents-md',
            title: 'AGENTS.md — raw agent context',
            sidebar_label: 'AGENTS.md',
            slug: '/agent/reference/agents-md',
        },
    },

    // Reference: llms.txt — same source as the static asset at /llms.txt,
    // but rendered in-site for a friendlier human view.
    {
        src: 'website/static/llms.txt',
        dest: 'reference/llms.md',
        meta: {
            id: 'llms',
            title: 'llms.txt — agent-readable site index',
            sidebar_label: 'llms.txt',
            slug: '/agent/reference/llms',
        },
    },

    // Install section — overview + 6 per-client docs + 2 universal fallbacks
    {
        src: 'cppjs-agents/README.md',
        dest: 'install/overview.md',
        meta: {
            id: 'overview',
            title: 'Install — pick your agent client',
            sidebar_label: 'Overview',
            slug: '/agent/install/overview',
        },
    },
    {
        src: 'cppjs-agents/install/claude-code.md',
        dest: 'install/claude-code.md',
        meta: {
            id: 'claude-code',
            title: 'Install cpp.js for Claude Code',
            sidebar_label: 'Claude Code',
            slug: '/agent/install/claude-code',
        },
    },
    {
        src: 'cppjs-agents/install/cursor.md',
        dest: 'install/cursor.md',
        meta: {
            id: 'cursor',
            title: 'Install cpp.js for Cursor',
            sidebar_label: 'Cursor',
            slug: '/agent/install/cursor',
        },
    },
    {
        src: 'cppjs-agents/install/codex.md',
        dest: 'install/codex.md',
        meta: {
            id: 'codex',
            title: 'Install cpp.js for OpenAI Codex CLI',
            sidebar_label: 'OpenAI Codex CLI',
            slug: '/agent/install/codex',
        },
    },
    {
        src: 'cppjs-agents/install/copilot.md',
        dest: 'install/copilot.md',
        meta: {
            id: 'copilot',
            title: 'Install cpp.js for GitHub Copilot CLI',
            sidebar_label: 'GitHub Copilot CLI',
            slug: '/agent/install/copilot',
        },
    },
    {
        src: 'cppjs-agents/install/gemini.md',
        dest: 'install/gemini.md',
        meta: {
            id: 'gemini',
            title: 'Install cpp.js for Google Gemini CLI',
            sidebar_label: 'Google Gemini CLI',
            slug: '/agent/install/gemini',
        },
    },
    {
        src: 'cppjs-agents/install/opencode.md',
        dest: 'install/opencode.md',
        meta: {
            id: 'opencode',
            title: 'Install cpp.js for OpenCode',
            sidebar_label: 'OpenCode',
            slug: '/agent/install/opencode',
        },
    },
    {
        src: 'cppjs-core/cppjs-mcp/README.md',
        dest: 'install/mcp.md',
        meta: {
            id: 'mcp',
            title: 'Install the @cpp.js/mcp server',
            sidebar_label: 'MCP Server (universal)',
            slug: '/agent/install/mcp',
        },
    },
    {
        src: 'cppjs-agents/install/skills-cli.md',
        dest: 'install/skills-cli.md',
        meta: {
            id: 'skills-cli',
            title: 'Install cpp.js skills via the skills CLI (50+ agents)',
            sidebar_label: 'Skills CLI (50+ agents)',
            slug: '/agent/install/skills-cli',
        },
    },
    {
        src: 'docs/agent-snippet.md',
        dest: 'install/snippet.md',
        meta: {
            id: 'snippet',
            title: 'AGENTS.md snippet — vendor-neutral fallback',
            sidebar_label: 'AGENTS.md Snippet',
            slug: '/agent/install/snippet',
        },
    },

    // Runtime / Config API (12 docs from docs/api/)
    {
        src: 'docs/api/README.md',
        dest: 'runtime-api/overview.md',
        meta: {
            id: 'overview',
            title: 'Runtime & Config API — overview',
            sidebar_label: 'Overview',
            slug: '/agent/runtime-api/overview',
        },
    },
    runtimeApi('init.md', 'init', 'initCppJs(opts) — Runtime API', 'initCppJs'),
    runtimeApi('cppjs-config.md', 'cppjs-config', 'cppjs.config.js (build-time)', 'cppjs.config.js'),
    runtimeApi('cppjs-build.md', 'cppjs-build', 'cppjs.build.js (package authors)', 'cppjs.build.js'),
    runtimeApi('filesystem.md', 'filesystem', 'Filesystem — OPFS, memfs, node-fs, edge', 'Filesystem'),
    runtimeApi('threading.md', 'threading', 'Threading — st vs mt, useWorker, COOP/COEP', 'Threading'),
    runtimeApi('cpp-binding-rules.md', 'cpp-binding-rules', 'C++ Binding Rules', 'C++ Binding Rules'),
    runtimeApi('swig-escape.md', 'swig-escape', 'SWIG escape hatch — manual .i files', 'SWIG escape'),
    runtimeApi('build-state.md', 'build-state', 'state and target shapes', 'state / target'),
    runtimeApi('overrides.md', 'overrides', 'Override mechanisms catalog', 'Overrides'),
    runtimeApi('troubleshooting.md', 'troubleshooting', 'Troubleshooting common errors', 'Troubleshooting'),
    runtimeApi('performance.md', 'performance', 'Performance — defaults & safe overrides', 'Performance'),
    runtimeApi('lifecycle-and-types.md', 'lifecycle-and-types', 'Lifecycle & TypeScript notes', 'Lifecycle & TS'),

    // Playbooks
    playbook('recommend-cppjs.md', 'recommend', 'Recognise and recommend cpp.js', 'Recommend cpp.js'),
    playbook('integration/README.md', 'integrate', 'Integrate cpp.js into an existing project', 'Integrate cpp.js'),
    playbook('new-package.md', 'new-package', 'Author a new cppjs-package-*', 'New package'),
    playbook('bug-fix.md', 'bug-fix', 'Fix a bug in cpp.js', 'Bug fix'),
    playbook('code-review.md', 'code-review', 'Code review checklist', 'Code review'),
    playbook('verify-install.md', 'verify-install', 'Verify your agent install', 'Verify install'),

    // Decisions (ADR)
    {
        src: 'docs/adr/README.md',
        dest: 'decisions/overview.md',
        meta: {
            id: 'overview',
            title: 'Architecture Decision Records — overview',
            sidebar_label: 'Overview',
            slug: '/agent/decisions/overview',
        },
    },
    adr('0001-agent-first-class-support.md', 'AI agents are first-class consumers'),
    adr('0002-pnpm-topological-build-order.md', 'pnpm workspace deps drive C++ link order'),
    adr('0003-function-typed-env-values.md', 'Function-typed env values'),
    adr('0004-three-layer-agent-distribution.md', 'Three-layer agent distribution'),
];

function runtimeApi(srcFile, idSlug, title, label) {
    return {
        src: `docs/api/${srcFile}`,
        dest: `runtime-api/${srcFile}`,
        meta: {
            id: idSlug,
            title,
            sidebar_label: label,
            slug: `/agent/runtime-api/${idSlug}`,
        },
    };
}

function playbook(srcFile, idSlug, title, label) {
    return {
        src: `docs/playbooks/${srcFile}`,
        dest: `playbooks/${idSlug}.md`,
        meta: {
            id: idSlug,
            title,
            sidebar_label: label,
            slug: `/agent/playbooks/${idSlug}`,
        },
    };
}

function adr(srcFile, title) {
    const idSlug = srcFile.replace('.md', '');
    const num = idSlug.split('-')[0];
    return {
        src: `docs/adr/${srcFile}`,
        dest: `decisions/${srcFile}`,
        meta: {
            id: idSlug,
            title: `ADR-${num}: ${title}`,
            sidebar_label: `ADR-${num}`,
            slug: `/agent/decisions/${idSlug}`,
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Link rewrite
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rewrite a single markdown link target so it makes sense inside Docusaurus.
 *
 * Cases:
 *   - https?:// → keep as-is
 *   - GitHub anchor (#…) → keep as-is
 *   - Sibling .md within agent docs → strip .md, normalise path
 *   - Out-of-agent path (cppjs-core/, cppjs-packages/, scripts/, .github/, …) → GitHub URL
 *   - docs/api/foo.md → ./foo  (when current doc is in same agent/runtime-api/)
 *   - docs/adr/0001-x.md → ../decisions/0001-x  (cross-section)
 *   - docs/playbooks/foo.md → ../playbooks/foo
 *   - AGENTS.md (root) → ../overview
 *   - CONTRIBUTING.md (root) → GitHub URL (not in agent docs)
 */
function rewriteLink(target, srcRepoPath, destWebsitePath) {
    if (!target) return target;

    // Absolute URL or anchor — keep
    if (/^https?:\/\//.test(target) || target.startsWith('#')) return target;
    if (target.startsWith('mailto:')) return target;

    // Drop the URL fragment for routing math; restore at the end
    const [pathPart, ...fragmentParts] = target.split('#');
    const fragment = fragmentParts.length ? `#${fragmentParts.join('#')}` : '';

    // Resolve the link target relative to the source file (in repo)
    const srcDir = path.dirname(srcRepoPath);
    const absoluteRepoPath = path.normalize(path.join(srcDir, pathPart));

    // Where does this absolute path land in the agent docs?
    const agentTarget = mapToAgentDest(absoluteRepoPath);

    if (agentTarget) {
        // Both source and target are inside agent docs — emit a clean relative link
        const fromDir = path.dirname(destWebsitePath);
        const toPath = agentTarget.replace(/\.md$/, '');
        let rel = path.relative(fromDir, toPath);
        if (!rel.startsWith('.')) rel = `./${rel}`;
        return rel + fragment;
    }

    // Target lives outside agent docs → rewrite to GitHub URL
    return `${GITHUB_BASE}/${absoluteRepoPath}${fragment}`;
}

/**
 * Given an absolute repo path (e.g. "docs/api/init.md"), return the corresponding
 * dest path under website/docs/agent/ if there's a mapping; null otherwise.
 */
function mapToAgentDest(absoluteRepoPath) {
    // Normalise leading ./
    const normalised = absoluteRepoPath.replace(/^\.\//, '');
    for (const file of FILES) {
        if (file.src === normalised) return file.dest;
    }
    // Special folder mappings (e.g. links to docs/adr/ folder)
    if (normalised === 'docs/adr' || normalised === 'docs/adr/') return 'decisions/overview.md';
    if (normalised === 'docs/api' || normalised === 'docs/api/') return 'runtime-api/overview.md';
    if (normalised === 'docs/playbooks/integration' || normalised === 'docs/playbooks/integration/README.md') {
        return 'playbooks/integrate.md';
    }
    return null;
}

/**
 * Rewrite all markdown link targets in a single document.
 */
function rewriteAllLinks(content, srcRepoPath, destWebsitePath) {
    // Match [text](target). Image syntax ![alt](...) also matches; same rewrite is correct.
    return content.replace(/(\[[^\]]*\])\(([^)]+)\)/g, (match, text, target) => {
        const rewritten = rewriteLink(target.trim(), srcRepoPath, destWebsitePath);
        return `${text}(${rewritten})`;
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strip an existing YAML frontmatter block (between two --- lines at the top).
 */
function stripFrontmatter(content) {
    const match = content.match(/^---\n[\s\S]*?\n---\n+/);
    if (!match) return content;
    return content.slice(match[0].length);
}

function buildFrontmatter(meta) {
    const lines = ['---'];
    for (const [k, v] of Object.entries(meta)) {
        // Quote strings that contain colons or special chars
        const value = typeof v === 'string' && /[:#'"\\]/.test(v) ? JSON.stringify(v) : v;
        lines.push(`${k}: ${value}`);
    }
    lines.push('---', '');
    return lines.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver
// ─────────────────────────────────────────────────────────────────────────────

function clean() {
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

function syncOne({ src, dest, meta }) {
    const srcPath = path.join(REPO_ROOT, src);
    if (!fs.existsSync(srcPath)) {
        process.stderr.write(`[sync-agent-docs] WARN: missing source ${src}\n`);
        return false;
    }

    let content = fs.readFileSync(srcPath, 'utf8');
    content = stripFrontmatter(content);
    content = rewriteAllLinks(content, src, dest);

    const finalContent = buildFrontmatter(meta) + content;
    const destPath = path.join(OUT_DIR, dest);
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, finalContent);
    return true;
}

function main() {
    clean();
    let ok = 0;
    let fail = 0;
    for (const file of FILES) {
        if (syncOne(file)) ok += 1;
        else fail += 1;
    }
    process.stderr.write(`[sync-agent-docs] copied ${ok} files to website/docs/agent/ (${fail} missing)\n`);
    if (fail > 0) process.exit(1);
}

main();
