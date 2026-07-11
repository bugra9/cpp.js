/* global WorkerGlobalScope */
import * as Comlink from 'comlink';

const STATIC_PATHS = {
    opfs: '/opfs',
    memfs: '/memfs',
};

const isWorkerScope = typeof WorkerGlobalScope !== 'undefined'
    && typeof self !== 'undefined'
    && self instanceof WorkerGlobalScope;

const isBrowserSupportOPFS = typeof navigator !== 'undefined'
    && navigator.storage
    && navigator.storage.getDirectory;

// Presence of the API does not guarantee a working backend: Playwright's WebKit
// rejects getDirectory() with UnknownError, and storage-restricted contexts
// reject too. false only after the onModuleReady preflight actually failed.
let isOpfsFunctional = true;

export default {
    extendModule(m, config) {
        // Hand the pthread spawn script to the glue via a cppjs-specific key. Using emscripten's
        // own mainScriptUrlOrBlob aborts emsdk 6 debug builds ("supplied but not included in
        // INCOMING_MODULE_JS_API") on single-thread targets; a custom key is not validated, and
        // buildWasm rewrites the pthread bootstrap to read it (falling back to _scriptName).
        const pthreadScript = config.paths.worker || config.paths.js;
        if (pthreadScript) {
            m.cppjsMainScript = m.locateFile(pthreadScript);
        }

        m.getDefaultPath = () => STATIC_PATHS[(config.fs?.opfs !== false && isOpfsFunctional) ? 'opfs' : 'memfs'];

        m.getFinalPath = function getFinalPath(path) {
            let returnPath = path;
            if (!path.startsWith('/')) {
                throw new Error(`Path ${path} does not start with /`);
            }

            const opfsConfigured = config.fs?.opfs !== false;

            let backend;
            Object.entries(STATIC_PATHS).forEach(([key, value]) => {
                if (path.startsWith(value)) {
                    backend = key;
                }
            });
            if (!backend) {
                throw new Error(`Path ${path} does not start with any of the static paths: ${Object.values(STATIC_PATHS).join(', ')}`);
            }
            if (backend === 'opfs' && !opfsConfigured) {
                throw new Error(`Path ${path} starts with ${STATIC_PATHS.opfs} but OPFS is disabled. Enable fs.opfs in config to mount under ${STATIC_PATHS.opfs}/.`);
            }
            if (backend === 'opfs' && !isWorkerScope) {
                throw new Error(`Path ${path} starts with ${STATIC_PATHS.opfs} but OPFS is only available inside a Worker scope. Enable useWorker or mount under ${STATIC_PATHS.memfs}/ instead. Falling back to ${STATIC_PATHS.memfs}/.`);
            }
            if (backend === 'opfs' && (!isBrowserSupportOPFS || !isOpfsFunctional)) {
                console.error(`Path ${path} starts with ${STATIC_PATHS.opfs} but OPFS is not usable in this browser. Falling back to ${STATIC_PATHS.memfs}/.`);
                returnPath = returnPath.replace(STATIC_PATHS.opfs, STATIC_PATHS.memfs);
            }

            return returnPath;
        };

        m.getRandomPath = function getRandomPath(startPath = m.getDefaultPath()) {
            const appName = config.general?.name;
            const rand = Math.floor(Math.random() * 1000000);
            const path = m.getFinalPath(`${startPath}/${appName}/automounted/${rand}`);
            m.FS.mkdirTree(path);
            return path;
        };

        m.autoMountFiles = function autoMountFiles(files, parentPath = null) {
            return new Promise((resolve, reject) => {
                if (files.length === 0) {
                    resolve([]);
                    return;
                }

                const mountPath = parentPath ? m.getFinalPath(parentPath) : m.getRandomPath();
                m.FS.mkdirTree(mountPath);

                (async () => {
                    try {
                        const paths = [];
                        for (const f of files) {
                            const filePath = `${mountPath}/${f.name}`;
                            const stream = m.FS.open(filePath, 'w');
                            const reader = f.stream().getReader();
                            let offset = 0;

                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                m.FS.write(stream, value, 0, value.length, offset);
                                offset += value.length;
                            }

                            m.FS.close(stream);
                            paths.push(filePath);
                        }
                        resolve(paths);
                    } catch (e) {
                        reject(e);
                    }
                })();
            });
        };

        m.getFileBytes = function getFileBytes(path) {
            if (!path) return new Uint8Array();
            return m.FS.readFile(path, { encoding: 'binary' });
        };

        m.getFileList = function getFileList(path = m.getDefaultPath()) {
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

        m._createVector = function _createVector(className, array = []) {
            const vector = m.toVector(className, array);
            return Comlink.proxy(vector);
        };
    },

    async onModuleReady(m, config) {
        const appName = config.general?.name;
        try {
            m.FS.mkdirTree(`${STATIC_PATHS.memfs}/${appName}/automounted`);
        } catch (e) {
            console.error(e);
        }

        if (!(isWorkerScope && isBrowserSupportOPFS && config.fs?.opfs !== false && typeof m.cppjs_init_opfs === 'function')) {
            return;
        }

        // cppjs_init_opfs() blocks until the OPFS root opens; if the backend is
        // broken, that rejection is swallowed inside the WASMFS proxy pthread and
        // init deadlocks with no signal. Probe the root here first instead.
        try {
            await navigator.storage.getDirectory();
        } catch (error) {
            isOpfsFunctional = false;
            console.error(`OPFS is present but not functional in this environment (${error}). Falling back to ${STATIC_PATHS.memfs}/.`);
            return;
        }

        m.cppjs_init_opfs();
        if (appName) {
            const appDir = `${STATIC_PATHS.opfs}/${appName}/automounted`;
            try {
                m.FS.mkdirTree(appDir);
            } catch (e) {
                console.error(e);
            }
        }
    },
};

export { STATIC_PATHS, isWorkerScope, isBrowserSupportOPFS };
