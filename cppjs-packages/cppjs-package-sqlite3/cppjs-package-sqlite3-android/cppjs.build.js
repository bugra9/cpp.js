import build from '@cpp.js/package-sqlite3/build.mjs';

export default {
    ...build,
    replaceList: [
        {
            regex: 'install-dll-unix-generic: install-dll-out-implib',
            replacement: 'install-dll-unix-generic: install-dll-out-implib\n\t$(INSTALL) $(libsqlite3.DLL) "$(install-dir.lib)"\ninstall-dll-unix-generic2:',
            paths: ['Makefile.in'],
        },
    ],
};
