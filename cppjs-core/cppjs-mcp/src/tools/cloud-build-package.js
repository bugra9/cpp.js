import { z } from 'zod';

export const name = 'cppjs_cloud_build_package';

export const config = {
    title: 'Build a cpp.js package on the cloud (placeholder)',
    description: 'Reserved for future cloud build service. Not implemented in the open-source MCP — local builds via cppjs_build_package work everywhere except iOS-on-non-macOS. Calling this tool returns a "not implemented" message and a pointer to local-build alternatives.',
    inputSchema: {
        name: z.string().describe('Package short name.'),
        arch: z.enum(['wasm', 'android', 'ios']).describe('Target arch.'),
    },
};

export async function handler({ name: pkgName, arch }) {
    const text = JSON.stringify(
        {
            status: 'not_implemented',
            reason: 'Cloud build is not part of the open-source MCP. It is reserved for a future hosted service.',
            requested: { package: pkgName, arch },
            alternatives: {
                local: `Run cppjs_build_package({ name: "${pkgName}", arch: "${arch}" }) on a host that supports the target.`,
                ios: 'iOS builds require macOS + Xcode. There is no Linux/Windows path.',
                android: 'Android builds work on Linux/macOS via Docker. See scripts/doctor.sh for prerequisites.',
                wasm: 'Wasm builds work on Linux/macOS via Docker (Emscripten image).',
            },
        },
        null,
        2,
    );
    return {
        isError: false,
        content: [{ type: 'text', text }],
    };
}
