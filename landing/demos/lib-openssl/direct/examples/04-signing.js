export const imports = {
    '@crossbind/port-openssl/openssl/evp.h': [
        'EVP_PKEY_Q_keygen',
        'EVP_PKEY_get0_type_name',
        'EVP_PKEY_get_security_bits',
        'EVP_PKEY_get_size',
        'EVP_PKEY_free',
        'EVP_MD_CTX_new',
        'EVP_MD_CTX_free',
        'EVP_DigestSignInit_ex',
        'EVP_DigestSign',
        'EVP_DigestVerifyInit_ex',
        'EVP_DigestVerify',
        'allocBuffer',
        'allocPointer',
        'readPointerAt',
        'readNumberAt',
        'writeBytes',
        'readBytes',
    ],
    '@crossbind/port-openssl/openssl/pem.h': ['PEM_write_bio_PUBKEY', 'PEM_read_bio_PUBKEY'],
    '@crossbind/port-openssl/openssl/bio.h': ['BIO_new', 'BIO_s_mem', 'BIO_puts', 'BIO_get_mem_data', 'BIO_free'],
};
export const note = '`EVP_PKEY_Q_keygen` is variadic: the curve name that follows `\'EC\'` goes in as a `const char *`, as any extra string argument does. Signing and verifying are the same `EVP_DigestSign` and `EVP_DigestVerify` calls, with the signature length read back from its out-parameter, and the public key\'s PEM comes out of a memory BIO through `BIO_get_mem_data`, as in the certificate example.';
export const expected = [
    'P-256: EC, 128-bit security, signatures up to 72 bytes, valid true, altered message false',
    'ED25519: ED25519, 128-bit security, signatures up to 64 bytes, valid true, altered message false',
    'ML-DSA-65: ML-DSA-65, 192-bit security, signatures up to 3309 bytes, valid true, altered message false',
];

export default async function example({ EVP_PKEY_Q_keygen, EVP_PKEY_get0_type_name, EVP_PKEY_get_security_bits, EVP_PKEY_get_size, EVP_PKEY_free, EVP_MD_CTX_new, EVP_MD_CTX_free, EVP_DigestSignInit_ex, EVP_DigestSign, EVP_DigestVerifyInit_ex, EVP_DigestVerify, allocBuffer, allocPointer, readPointerAt, readNumberAt, writeBytes, readBytes, PEM_write_bio_PUBKEY, PEM_read_bio_PUBKEY, BIO_new, BIO_s_mem, BIO_puts, BIO_get_mem_data, BIO_free }, console) {
    const bytes = async (text) => {
        const buffer = await allocBuffer(text.length);
        await writeBytes(buffer, text);
        return buffer;
    };
    // OpenSSL writes PEM into a BIO: `printed` passes a memory BIO first and returns what went in.
    const printed = async (print, ...args) => {
        const out = await BIO_new(await BIO_s_mem());
        await print(out, ...args);
        const data = await allocPointer(1);
        const size = await BIO_get_mem_data(out, data);
        const text = await readBytes(await readPointerAt(data, 0), size);
        await BIO_free(out);
        return text;
    };
    // The receiving side, with nothing but the public key's PEM, the message and the signature.
    const verify = async (pem, digest, text, signature, signatureSize) => {
        const input = await BIO_new(await BIO_s_mem());
        await BIO_puts(input, pem);
        const publicKey = await PEM_read_bio_PUBKEY(input, null, null, null);
        await BIO_free(input);
        const context = await EVP_MD_CTX_new();
        await EVP_DigestVerifyInit_ex(context, null, digest, null, null, publicKey, null);
        const valid = (await EVP_DigestVerify(context, signature, signatureSize, await bytes(text), text.length)) === 1;
        await EVP_MD_CTX_free(context);
        await EVP_PKEY_free(publicKey);
        return valid;
    };

    const message = 'release 2.4.0, sha256 3a985da74fe225b2';
    for (const algorithm of ['P-256', 'ED25519', 'ML-DSA-65']) {
        const key = algorithm === 'P-256' ? await EVP_PKEY_Q_keygen(null, null, 'EC', 'P-256') : await EVP_PKEY_Q_keygen(null, null, algorithm);

        // ECDSA signs a SHA-256 digest of the message; Ed25519 and ML-DSA take the message whole.
        // The first EVP_DigestSign gives the largest size, the second signs and gives the real one.
        const digest = algorithm === 'P-256' ? 'SHA256' : null;
        const data = await bytes(message);
        const size = await allocBuffer(4);
        const context = await EVP_MD_CTX_new();
        await EVP_DigestSignInit_ex(context, null, digest, null, null, key, null);
        await EVP_DigestSign(context, null, size, data, message.length);
        const signature = await allocBuffer(await readNumberAt(size, 0, 'uint32'));
        await EVP_DigestSign(context, signature, size, data, message.length);
        await EVP_MD_CTX_free(context);
        const signatureSize = await readNumberAt(size, 0, 'uint32');

        const pem = await printed(PEM_write_bio_PUBKEY, key);
        const valid = await verify(pem, digest, message, signature, signatureSize);
        const altered = await verify(pem, digest, message.replace('2.4.0', '2.4.1'), signature, signatureSize);
        const type = await EVP_PKEY_get0_type_name(key);
        const bits = await EVP_PKEY_get_security_bits(key);
        const largest = await EVP_PKEY_get_size(key);
        console.log(`${algorithm}: ${type}, ${bits}-bit security, signatures up to ${largest} bytes, valid ${valid}, altered message ${altered}`);
        await EVP_PKEY_free(key);
    }
}
