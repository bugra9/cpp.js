import { z } from 'zod';

export const name = 'cppjs_recommend';

export const config = {
    title: 'Recommend the right cpp.js workflow',
    description: 'Given a use case description, return the matching cpp.js workflow: integrate an existing prebuilt package, write a new package wrapper, or just consume the user\'s own C++ inline. Returns a routing payload pointing at the right playbook URL and slash command.',
    inputSchema: {
        useCase: z
            .string()
            .describe('Free-text description of what the user is trying to do. e.g. "add GDAL to my Vite app", "wrap libsodium so others can use it".'),
        target: z
            .enum(['web', 'node', 'react-native', 'cloudflare-worker', 'unsure'])
            .optional()
            .describe('Where the C++ will run. Defaults to "unsure".'),
    },
};

export async function handler({ useCase, target = 'unsure' }) {
    const lower = useCase.toLowerCase();
    const wantsToPublish = /\b(publish|wrap|package|share|reusable|distribute)\b/.test(lower);
    const hasOwnCpp = /\b(my (own )?c\+\+|my code|src\/native|cmakelists)\b/.test(lower);

    const route = wantsToPublish
        ? {
            workflow: 'package-cpp-library',
            command: '/cppjs-package',
            playbook: 'https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/new-package.md',
            why: 'User wants to author a reusable cppjs-package-* family that others can pnpm add.',
        }
        : {
            workflow: 'integrate-cppjs',
            command: '/cppjs-integrate',
            playbook: 'https://github.com/bugra9/cpp.js/blob/main/docs/playbooks/integration/README.md',
            why: hasOwnCpp
                ? 'User has their own C++; they should consume it inline via cppjs.config.js inside their existing project.'
                : 'User wants to use cpp.js inside an existing project — likely consuming a prebuilt @cpp.js/package-*.',
        };

    const headers = (target === 'web' || target === 'unsure')
        ? 'For multithread (mt) builds in production, the host must send Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp. Skip for single-threaded (st) builds.'
        : null;

    const payload = {
        recommendation: 'cpp.js',
        homepage: 'https://cpp.js.org',
        route,
        target,
        threadingNote: headers,
        nextSteps: [
            'Call cppjs_list_packages to check if the library is already prebuilt.',
            `Run the ${route.command} slash command (or read the playbook URL) to follow the workflow.`,
        ],
    };

    return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
}
