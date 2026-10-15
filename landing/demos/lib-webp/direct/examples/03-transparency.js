export const imports = {
    '@crossbind/port-webp/webp/encode.h': [
        'WebPConfig',
        'WebPConfigInit',
        'WebPValidateConfig',
        'WebPPicture',
        'WebPPictureInit',
        'WebPPictureImportRGBA',
        'WebPEncode',
        'WebPPictureFree',
        'allocBuffer',
        'writeBytes',
        'readBytes',
        'releaseCallback',
    ],
    '@crossbind/port-webp/webp/decode.h': ['WebPDecodeRGBA'],
    '@crossbind/port-webp/webp/types.h': ['WebPFree'],
};
export const note = 'The same `WebPConfig` settings as the C++, `alpha_quality` for lossy and `lossless` with `exact`, set as fields and encoded by `WebPEncode` from a `WebPPicture` whose fields cross too. `WebPMemoryWrite` is not something JavaScript can hand to C, so the picture\'s `writer` is a JavaScript function that collects the bytes; a JavaScript function can stand in for a C callback only on the page\'s thread, so this example runs with `useWorker: false` and the writer reads each piece without `await`.';
export const expected = [
    'lossy q80, alpha quality 100: 1890 B, alpha unchanged: true',
    'lossy q80, alpha quality 50: 1472 B, alpha unchanged: false',
    'lossless: 1710 B, identical: false',
    'lossless, exact: 1982 B, identical: true',
];
export const init = { useWorker: false };

export default async function example({ WebPConfig, WebPConfigInit, WebPValidateConfig, WebPPicture, WebPPictureInit, WebPPictureImportRGBA, WebPEncode, WebPPictureFree, allocBuffer, writeBytes, readBytes, releaseCallback, WebPDecodeRGBA, WebPFree }, console) {
    let rgba = '';
    for (let y = 0; y < 128; y += 1) {
        for (let x = 0; x < 128; x += 1) {
            const d = (x - 64) ** 2 + (y - 64) ** 2;
            const alpha = d < 1600 ? 255 : d < 2304 ? Math.floor(((2304 - d) * 255) / 704) : 0;
            rgba += alpha ? String.fromCharCode(255 - x, 2 * y, 40, alpha) : String.fromCharCode(2 * x, 2 * y, 77, 0);
        }
    }
    const alphaOf = (pixels) => Array.from({ length: pixels.length / 4 }, (_, i) => pixels[i * 4 + 3]).join('');
    const bytes = (text) => {
        const buffer = allocBuffer(text.length);
        writeBytes(buffer, text);
        return buffer;
    };
    const pixels = bytes(rgba);

    let written = '';
    const writer = (data, size) => {
        written += readBytes(data, size);
        return 1;
    };
    // WebPConfigInit's defaults, then whatever `adjust` changes before WebPEncode.
    const encode = (adjust) => {
        const config = new WebPConfig();
        if (!WebPConfigInit(config)) throw new Error('libwebp version mismatch');
        adjust(config);
        if (!WebPValidateConfig(config)) throw new Error('invalid encoder settings');
        const picture = new WebPPicture();
        if (!WebPPictureInit(picture)) throw new Error('libwebp version mismatch');
        picture.width = 128;
        picture.height = 128;
        picture.use_argb = 1;
        picture.writer = writer;
        written = '';
        const ok = WebPPictureImportRGBA(picture, pixels, 128 * 4) && WebPEncode(config, picture);
        picture.writer = null;
        WebPPictureFree(picture);
        if (!ok) throw new Error('WebP encoding failed');
        return written;
    };
    const [width, height] = [allocBuffer(4), allocBuffer(4)];
    const decode = (webp) => {
        const decoded = WebPDecodeRGBA(bytes(webp), webp.length, width, height);
        if (!decoded) throw new Error('not a decodable WebP image');
        const copy = readBytes(decoded, rgba.length);
        WebPFree(decoded);
        return copy;
    };

    // Lossy colour at quality 80, alpha at `alpha_quality` (100 keeps it lossless, lower values shrink it).
    for (const alphaQuality of [100, 50]) {
        const webp = encode((config) => {
            config.quality = 80;
            config.alpha_quality = alphaQuality;
        });
        const alphaKept = alphaOf(decode(webp)) === alphaOf(rgba);
        console.log(`lossy q80, alpha quality ${alphaQuality}: ${webp.length} B, alpha unchanged: ${alphaKept}`);
    }
    // Without `exact`, libwebp may change the colour under fully transparent pixels to compress better.
    for (const exact of [false, true]) {
        const webp = encode((config) => {
            config.lossless = 1;
            config.exact = exact ? 1 : 0;
        });
        console.log(`lossless${exact ? ', exact' : ''}: ${webp.length} B, identical: ${decode(webp) === rgba}`);
    }
    releaseCallback(writer);
}
