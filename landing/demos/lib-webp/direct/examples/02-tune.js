export const imports = {
    '@crossbind/port-webp/webp/encode.h': [
        'WebPConfig',
        'WebPConfigPreset',
        'WebPPreset',
        'WebPValidateConfig',
        'WebPPicture',
        'WebPPictureInit',
        'WebPPictureImportRGBA',
        'WebPEncode',
        'WebPPictureFree',
        'WebPPlaneDistortion',
        'allocBuffer',
        'writeBytes',
        'readBytes',
        'readNumberAt',
        'releaseCallback',
    ],
    '@crossbind/port-webp/webp/decode.h': ['WebPDecodeRGBA'],
    '@crossbind/port-webp/webp/types.h': ['WebPFree'],
};
export const note = 'The same advanced API: `WebPConfig` and `WebPPicture` cross with their fields, so the preset, `method`, `use_sharp_yuv`, `target_size` and the picture\'s size are set as in the C++. `WebPMemoryWrite` is not something JavaScript can hand to C, so the picture\'s `writer` is a JavaScript function that collects the bytes; a JavaScript function can stand in for a C callback only on the page\'s thread, so this example runs with `useWorker: false` and the writer reads each piece without `await`. A handle has no pointer arithmetic, so where the C++ passes `source + channel`, `WebPPlaneDistortion` gets a copy of the pixels that starts at that channel\'s byte.';
export const expected = [
    'photo q50: 1300 B, PSNR 33.64 dB, SSIM 0.8993',
    'photo q75: 1658 B, PSNR 34.26 dB, SSIM 0.9047',
    'photo q90: 4388 B, PSNR 35.02 dB, SSIM 0.9133',
    'photo q75, method 6, sharp YUV: 1708 B, PSNR 34.58 dB, SSIM 0.9050',
    'photo, 3000 B target: 3000 B, PSNR 34.83 dB, SSIM 0.9097',
];
export const init = { useWorker: false };

export default async function example({ WebPConfig, WebPConfigPreset, WebPPreset, WebPValidateConfig, WebPPicture, WebPPictureInit, WebPPictureImportRGBA, WebPEncode, WebPPictureFree, WebPPlaneDistortion, allocBuffer, writeBytes, readBytes, readNumberAt, releaseCallback, WebPDecodeRGBA, WebPFree }, console) {
    let seed = 1;
    const random = (n) => (seed = (seed * 48271) % 2147483647) % n;
    let rgba = '';
    for (let y = 0; y < 256; y += 1) {
        for (let x = 0; x < 256; x += 1) {
            const sun = (x - 180) ** 2 + (y - 70) ** 2 < 900;
            const hill = y > 170 + (((x - 128) ** 2) >> 8);
            const [r, g, b] = sun ? [255, 214, 90] : hill ? [40 + (y >> 2), 120 + (x >> 3), 50] : [90 + (y >> 1), 150 + (y >> 2), 235];
            rgba += String.fromCharCode(r ^ random(8), g ^ random(8), b ^ random(8), 255);
        }
    }
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
    // The photo preset at a quality, then whatever `adjust` changes before WebPEncode.
    const encode = (quality, adjust = () => {}) => {
        const config = new WebPConfig();
        if (!WebPConfigPreset(config, WebPPreset.WEBP_PRESET_PHOTO, quality)) throw new Error('libwebp version mismatch');
        adjust(config);
        if (!WebPValidateConfig(config)) throw new Error('invalid encoder settings');
        const picture = new WebPPicture();
        if (!WebPPictureInit(picture)) throw new Error('libwebp version mismatch');
        picture.width = 256;
        picture.height = 256;
        // ARGB input lets WebPEncode do the YUV conversion itself, which is where sharp YUV applies.
        picture.use_argb = 1;
        picture.writer = writer;
        written = '';
        const ok = WebPPictureImportRGBA(picture, pixels, 256 * 4) && WebPEncode(config, picture);
        const error = picture.error_code;
        picture.writer = null;
        WebPPictureFree(picture);
        if (!ok) throw new Error(`WebP encoding failed with error ${error}`);
        return written;
    };

    // PSNR over red, green and blue, and libwebp's SSIM over the same channels (1 means identical).
    const distortion = allocBuffer(4); // float *
    const result = allocBuffer(4);
    const [width, height] = [allocBuffer(4), allocBuffer(4)];
    const compare = (webp) => {
        const decodedPixels = WebPDecodeRGBA(bytes(webp), webp.length, width, height);
        if (!decodedPixels) throw new Error('not a decodable WebP image');
        const decoded = readBytes(decodedPixels, rgba.length);
        WebPFree(decodedPixels);
        let squaredError = 0;
        let similarity = 0;
        for (let channel = 0; channel < 3; channel += 1) {
            const [source, copy] = [bytes(rgba.slice(channel)), bytes(decoded.slice(channel))];
            WebPPlaneDistortion(source, 256 * 4, copy, 256 * 4, 256, 256, 4, 0, distortion, result);
            squaredError += readNumberAt(distortion, 0, 'float32');
            WebPPlaneDistortion(source, 256 * 4, copy, 256 * 4, 256, 256, 4, 1, distortion, result);
            similarity += readNumberAt(distortion, 0, 'float32');
        }
        const samples = 3 * 256 * 256;
        const psnr = squaredError > 0 ? 10 * Math.log10((255 * 255 * samples) / squaredError) : 99;
        return `PSNR ${psnr.toFixed(2)} dB, SSIM ${(similarity / samples).toFixed(4)}`;
    };

    for (const quality of [50, 75, 90]) {
        const webp = encode(quality);
        console.log(`photo q${quality}: ${webp.length} B, ${compare(webp)}`);
    }
    const tuned = encode(75, (config) => {
        config.method = 6;
        config.use_sharp_yuv = 1;
    });
    console.log(`photo q75, method 6, sharp YUV: ${tuned.length} B, ${compare(tuned)}`);
    // The encoder searches for the quality that lands closest to this many bytes, over up to 6 passes.
    const fitted = encode(75, (config) => {
        config.target_size = 3000;
        config.pass = 6;
    });
    console.log(`photo, 3000 B target: ${fitted.length} B, ${compare(fitted)}`);
    releaseCallback(writer);
}
