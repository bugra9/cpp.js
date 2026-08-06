import base from '@cpp.js/package-expat/build.mjs';

export default {
    ...base,
    getBuildParams: (target) => [
        ...base.getBuildParams(target).filter((p) => p !== '-DEXPAT_BUILD_TOOLS=OFF'),
        '-DEXPAT_BUILD_TOOLS=ON',
    ],
    bin: { tools: { xmlwf: { kind: 'binary', publish: true } } },
};
