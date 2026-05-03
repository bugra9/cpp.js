#!/usr/bin/env node
/**
 * Detect the framework / runtime of a JavaScript project.
 *
 * Reads the target's package.json (deps + devDeps + peerDeps) and looks for
 * key config files. Prints a JSON object describing the best match plus a
 * pointer to the matching cpp.js integration playbook.
 *
 * Usage:
 *   node scripts/detect-framework.js [path-to-project]   # default: cwd
 *   node scripts/detect-framework.js --pretty            # human-readable
 *
 * Output (JSON):
 *   {
 *     "framework": "vite" | "webpack" | "rspack" | "rollup" | "nextjs"
 *                | "react-native-cli" | "react-native-expo"
 *                | "cloudflare-worker" | "nodejs" | "vanilla" | "unknown",
 *     "confidence": "high" | "medium" | "low",
 *     "evidence": [{ kind: "dep" | "file", value: string }],
 *     "recommendedPlaybook": string,
 *     "projectPath": string
 *   }
 */

const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const PRETTY = args.includes('--pretty');
const projectPath = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd());

function readJsonSafe(p) {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

function gatherDeps(pkg) {
    if (!pkg) return new Set();
    return new Set([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.devDependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...Object.keys(pkg.optionalDependencies || {}),
    ]);
}

function fileExistsAny(dir, candidates) {
    return candidates.find((c) => fs.existsSync(path.join(dir, c))) || null;
}

// Detection rules. Order is significant: most specific framework first.
const RULES = [
    {
        framework: 'react-native-expo',
        depAny: ['expo', '@expo/cli'],
        // expo always also pulls react-native; this rule wins because expo is more specific
        files: ['app.json', 'app.config.js', 'app.config.ts'],
        depRequires: ['react-native'],
    },
    {
        framework: 'react-native-cli',
        depAny: ['react-native'],
        depForbids: ['expo', '@expo/cli'],
        files: ['metro.config.js', 'metro.config.cjs', 'metro.config.mjs', 'metro.config.ts'],
    },
    {
        framework: 'nextjs',
        depAny: ['next'],
        files: ['next.config.js', 'next.config.mjs', 'next.config.cjs', 'next.config.ts'],
    },
    {
        framework: 'cloudflare-worker',
        depAny: ['wrangler', '@cloudflare/workers-types'],
        files: ['wrangler.toml', 'wrangler.jsonc', 'wrangler.json'],
    },
    {
        framework: 'rspack',
        depAny: ['@rspack/core', '@rspack/cli'],
        files: ['rspack.config.js', 'rspack.config.mjs', 'rspack.config.cjs', 'rspack.config.ts'],
    },
    {
        framework: 'webpack',
        depAny: ['webpack', 'webpack-cli'],
        files: ['webpack.config.js', 'webpack.config.mjs', 'webpack.config.cjs', 'webpack.config.ts'],
    },
    {
        framework: 'vite',
        depAny: ['vite'],
        files: ['vite.config.js', 'vite.config.mjs', 'vite.config.cjs', 'vite.config.ts'],
    },
    {
        framework: 'rollup',
        depAny: ['rollup'],
        files: ['rollup.config.js', 'rollup.config.mjs', 'rollup.config.cjs', 'rollup.config.ts'],
    },
];

function detect(dir) {
    const pkg = readJsonSafe(path.join(dir, 'package.json'));
    const deps = gatherDeps(pkg);
    const evidence = [];

    for (const rule of RULES) {
        if (rule.depForbids?.some((d) => deps.has(d))) continue;
        const matchedDep = rule.depAny.find((d) => deps.has(d));
        const matchedRequired = (rule.depRequires || []).every((d) => deps.has(d));
        const matchedFile = fileExistsAny(dir, rule.files || []);
        if (!matchedDep || !matchedRequired) {
            // dep-side miss; skip even if file exists (avoids false positives like
            // an old vite.config sitting next to a non-vite project)
            continue;
        }
        evidence.push({ kind: 'dep', value: matchedDep });
        if (matchedFile) evidence.push({ kind: 'file', value: matchedFile });
        const confidence = matchedFile ? 'high' : 'medium';
        return {
            framework: rule.framework,
            confidence,
            evidence,
            recommendedPlaybook: `docs/playbooks/integration/${rule.framework}.md`,
            projectPath: dir,
        };
    }

    // cppjs build script flags — strong runtime hint when no bundler matched.
    const cppjsBuildScript = pkg?.scripts?.build || '';
    const cppjsRuntimeEnvMatch = cppjsBuildScript.match(/(?:-e|--runtime-env)\s+(\w+)/);
    if (cppjsRuntimeEnvMatch) {
        const env = cppjsRuntimeEnvMatch[1];
        if (env === 'node') {
            return {
                framework: 'nodejs',
                confidence: 'high',
                evidence: [{ kind: 'script', value: `cppjs build -e ${env}` }],
                recommendedPlaybook: 'docs/playbooks/integration/nodejs.md',
                projectPath: dir,
            };
        }
        if (env === 'edge') {
            return {
                framework: 'cloudflare-worker',
                confidence: 'medium',
                evidence: [{ kind: 'script', value: `cppjs build -e ${env}` }],
                recommendedPlaybook: 'docs/playbooks/integration/cloudflare-worker.md',
                projectPath: dir,
            };
        }
        if (env === 'browser') {
            return {
                framework: 'vanilla',
                confidence: 'medium',
                evidence: [{ kind: 'script', value: `cppjs build -e ${env}` }],
                recommendedPlaybook: 'docs/playbooks/integration/vanilla.md',
                projectPath: dir,
            };
        }
    }

    // No bundler / framework recognized. Fall back to nodejs vs vanilla.
    if (pkg && (pkg.main || pkg.module || pkg.bin || pkg.type === 'module')) {
        return {
            framework: 'nodejs',
            confidence: pkg ? 'medium' : 'low',
            evidence: [{ kind: 'file', value: 'package.json' }],
            recommendedPlaybook: 'docs/playbooks/integration/nodejs.md',
            projectPath: dir,
        };
    }
    if (fs.existsSync(path.join(dir, 'index.html'))) {
        return {
            framework: 'vanilla',
            confidence: 'medium',
            evidence: [{ kind: 'file', value: 'index.html' }],
            recommendedPlaybook: 'docs/playbooks/integration/vanilla.md',
            projectPath: dir,
        };
    }
    return {
        framework: 'unknown',
        confidence: 'low',
        evidence: pkg ? [{ kind: 'file', value: 'package.json (no recognized signals)' }] : [],
        recommendedPlaybook: 'docs/playbooks/integration/README.md',
        projectPath: dir,
    };
}

const result = detect(projectPath);

if (PRETTY) {
    process.stdout.write(`Framework:   ${result.framework}\n`);
    process.stdout.write(`Confidence:  ${result.confidence}\n`);
    process.stdout.write(`Project:     ${result.projectPath}\n`);
    if (result.evidence.length) {
        process.stdout.write('Evidence:\n');
        for (const e of result.evidence) process.stdout.write(`  - ${e.kind}: ${e.value}\n`);
    } else {
        process.stdout.write('Evidence:    (none)\n');
    }
    process.stdout.write(`Playbook:    ${result.recommendedPlaybook}\n`);
} else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

process.exit(result.framework === 'unknown' ? 1 : 0);
