import crypto from 'node:crypto';

// The e2e app's updates, signed with a key anyone can make from this text: it tests the updater and signs no app.
const SEED = crypto.createHash('sha256').update('crossbind e2e desktop-app updates').digest();
const PRIVATE_KEY = crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), SEED]),
    format: 'der',
    type: 'pkcs8',
});
export const UPDATE_PORT = 47380;

// app.updater of crossbind.config.mjs.
export const UPDATER = {
    url: `http://127.0.0.1:${UPDATE_PORT}/{platform}-{arch}.update.json`,
    publicKey: crypto.createPublicKey(PRIVATE_KEY).export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64'),
};

// The signature `crossbind app build` gives an update's file, written here as the app's host reads it.
export function signUpdate(id, target, version, bytes) {
    const hash = crypto.createHash('sha512').update(bytes).digest('hex');
    return crypto.sign(null, Buffer.from(`crossbind update\n${id}\n${target}\n${version}\n${hash}\n`), PRIVATE_KEY).toString('base64');
}
