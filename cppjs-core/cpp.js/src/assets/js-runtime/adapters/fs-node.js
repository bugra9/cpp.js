export default {
    extendModule(m) {
        m.getPreloadedPackage = function getPreloadedPackage(packageName) {
            // eslint-disable-next-line global-require
            return require('fs').readFileSync(`./${packageName}`, { flag: 'r' }).buffer;
        };

        m.getFileBytes = function getFileBytes(path) {
            if (!path) return new Uint8Array();
            return m.FS.readFile(path, { encoding: 'binary' });
        };

        m.getFileList = function getFileList(path = '/memfs') {
            const fileList = [];
            for (const name of m.FS.readdir(path)) {
                if (name === '.' || name === '..') continue;
                const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;
                const stat = m.FS.stat(fullPath);
                const type = stat.mode & 0o170000;
                if (type === 0o040000) {
                    fileList.push(...m.getFileList(fullPath));
                } else if (type === 0o100000) {
                    fileList.push({ path: fullPath, size: stat.size });
                }
            }
            return fileList;
        };
    },
};
