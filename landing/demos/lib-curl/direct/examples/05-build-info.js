export const imports = {
    '@crossbind/port-curl/curl/curl.h': ['curl_version', 'curl_version_info', 'CURLversion', 'readPointerAt', 'readCString'],
};
export const note = '`curl_version` returns a `char *`, read with `readCString` and not freed: it points at a static buffer. `CURLVERSION_NOW` has no binding, as a macro naming an enum member rather than a function, so the call passes the member itself, `CURLVERSION_TWELFTH`. The `protocols` and `feature_names` fields of `curl_version_info_data` are `const char * const *` lists ending in `NULL`: each reads as a handle that `readPointerAt` steps through until it returns `null`, and `readCString` reads every name.';
export const expected = ({ curl, openssl }) => [
    `libcurl/${curl} OpenSSL/${openssl}`,
    'dict file ftp ftps gopher gophers http https imap imaps mqtt mqtts pop3 pop3s rtsp smtp smtps telnet tftp ws wss',
    'alt-svc AsynchDNS HSTS HTTPS-proxy Largefile SSL threadsafe UnixSockets',
    'false true',
];

export default async function example({ curl_version, curl_version_info, CURLversion, readPointerAt, readCString }, console) {
    console.log(await readCString(await curl_version()));

    const info = await curl_version_info(await CURLversion.CURLVERSION_TWELFTH);
    const names = async (list) => {
        const items = [];
        let item;
        while ((item = await readPointerAt(list, items.length))) items.push(await readCString(item));
        return items;
    };
    console.log((await names(await info.protocols)).join(' '));
    const features = await names(await info.feature_names);
    console.log(features.join(' '));
    console.log(features.includes('HTTP2'), features.includes('HSTS'));
}
