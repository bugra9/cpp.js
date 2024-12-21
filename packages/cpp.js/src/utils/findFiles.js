import { glob } from 'glob';

export default function findFiles(regex, options = {}) {
    return glob.sync(regex, { absolute: true, posix: true, ...options }).map(p => p.replace('//?/', ''));
}
