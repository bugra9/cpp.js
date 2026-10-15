export const imports = {
    '@crossbind/port-tiff/tiffio.h': [
        'TIFFClientOpen',
        'TIFFSetField',
        'TIFFGetField',
        'TIFFGetFieldDefaulted',
        'TIFFDefaultStripSize',
        'TIFFWriteScanline',
        'TIFFReadScanline',
        'TIFFIsTiled',
        'TIFFRGBAImageOK',
        'TIFFClose',
        'allocBuffer',
        'readBuffer',
        'writeBuffer',
        'readNumberAt',
        'readCString',
        'releaseCallback',
    ],
    '@crossbind/port-tiff/tiff.h': [
        'TIFFTAG_IMAGEWIDTH',
        'TIFFTAG_IMAGELENGTH',
        'TIFFTAG_SAMPLESPERPIXEL',
        'TIFFTAG_BITSPERSAMPLE',
        'TIFFTAG_SAMPLEFORMAT',
        'TIFFTAG_PHOTOMETRIC',
        'TIFFTAG_COMPRESSION',
        'TIFFTAG_PREDICTOR',
        'TIFFTAG_ROWSPERSTRIP',
        'SAMPLEFORMAT_IEEEFP',
        'PHOTOMETRIC_MINISBLACK',
        'COMPRESSION_ADOBE_DEFLATE',
        'PREDICTOR_NONE',
        'PREDICTOR_FLOATINGPOINT',
    ],
};
export const note = 'The same tags through the variadic `TIFFSetField`, with the sample format, the codec and the predictor imported from `tiff.h` where the C++ took numbers from its caller. The samples cross as the bytes of a `Float32Array`, a row at a time with `writeBuffer` and `readBuffer`, into a file that `TIFFClientOpen` keeps in a `Uint8Array` through JavaScript callbacks, so the module runs on the page\'s thread. `TIFFRGBAImageOK` writes its reason into a 1024-byte `allocBuffer` read with `readCString`.';
export const expected = ['262144 B of float32 -> Deflate 123852 B, with predictor 3 9072 B', 'true', 'Sorry, can not handle images with 32-bit samples'];
export const init = { useWorker: false };

export default async function example({ TIFFClientOpen, TIFFSetField, TIFFGetField, TIFFGetFieldDefaulted, TIFFDefaultStripSize, TIFFWriteScanline, TIFFReadScanline, TIFFIsTiled, TIFFRGBAImageOK, TIFFClose, allocBuffer, readBuffer, writeBuffer, readNumberAt, readCString, releaseCallback, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLEFORMAT, TIFFTAG_PHOTOMETRIC, TIFFTAG_COMPRESSION, TIFFTAG_PREDICTOR, TIFFTAG_ROWSPERSTRIP, SAMPLEFORMAT_IEEEFP, PHOTOMETRIC_MINISBLACK, COMPRESSION_ADOBE_DEFLATE, PREDICTOR_NONE, PREDICTOR_FLOATINGPOINT }, console) {
    const width = 256;
    const height = 256;
    // An elevation grid in metres: a smooth saddle in steps of 1/64 m, so float32 holds every value exactly.
    const heights = new Float32Array(width * height);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) heights[y * width + x] = 500 + ((x - 128) * (y - 96)) / 64;
    }
    const samples = new Uint8Array(heights.buffer); // little-endian float32 bytes, as wasm reads them

    // The file in memory: bytes that libtiff reads, writes and seeks through these callbacks.
    let file = new Uint8Array(0);
    let position = 0;
    const read = (handle, buffer, count) => {
        const bytes = file.subarray(position, position + count);
        writeBuffer(buffer, bytes);
        position += bytes.length;
        return bytes.length;
    };
    const write = (handle, buffer, count) => {
        if (position + count > file.length) {
            const grown = new Uint8Array(position + count);
            grown.set(file);
            file = grown;
        }
        file.set(readBuffer(buffer, count), position);
        position += count;
        return count;
    };
    const seek = (handle, offset, whence) => (position = [0, position, file.length][whence] + Number(offset)); // SEEK_SET, SEEK_CUR, SEEK_END
    const close = () => 0;
    const fileSize = () => file.length;
    const open = (mode) => {
        if (mode === 'w') file = new Uint8Array(0);
        position = 0;
        return TIFFClientOpen('memory', mode, null, read, write, seek, close, fileSize, null, null);
    };

    // One band of 32-bit floats, written a scanline at a time; the predictor is left out when it is PREDICTOR_NONE.
    const row = await allocBuffer(width * 4);
    const writeFloat32 = async (compression, predictor) => {
        const tif = await open('w');
        await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, width);
        await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, height);
        await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
        await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 32);
        await TIFFSetField(tif, TIFFTAG_SAMPLEFORMAT, SAMPLEFORMAT_IEEEFP);
        await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISBLACK);
        await TIFFSetField(tif, TIFFTAG_COMPRESSION, compression);
        if (predictor !== PREDICTOR_NONE) await TIFFSetField(tif, TIFFTAG_PREDICTOR, predictor);
        await TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, await TIFFDefaultStripSize(tif, 0));
        for (let y = 0; y < height; y += 1) {
            await writeBuffer(row, samples.subarray(y * width * 4, (y + 1) * width * 4));
            if ((await TIFFWriteScanline(tif, row, y, 0)) < 0) throw new Error(`libtiff could not write row ${y}`);
        }
        await TIFFClose(tif);
        return file.length;
    };
    const plain = await writeFloat32(COMPRESSION_ADOBE_DEFLATE, PREDICTOR_NONE);
    const predicted = await writeFloat32(COMPRESSION_ADOBE_DEFLATE, PREDICTOR_FLOATINGPOINT);
    console.log(`${samples.length} B of float32 -> Deflate ${plain} B, with predictor 3 ${predicted} B`);

    // The samples of the predictor-3 file back, row by row with TIFFReadScanline.
    let tif = await open('r');
    const value = await allocBuffer(4);
    const uint32 = async (tag) => (await TIFFGetField(tif, tag, value)) && readNumberAt(value, 0, 'uint32');
    const uint16 = async (tag) => (await TIFFGetFieldDefaulted(tif, tag, value)) && readNumberAt(value, 0, 'uint16');
    const [rows, columns] = [await uint32(TIFFTAG_IMAGELENGTH), await uint32(TIFFTAG_IMAGEWIDTH)];
    const [bits, format, bands] = [await uint16(TIFFTAG_BITSPERSAMPLE), await uint16(TIFFTAG_SAMPLEFORMAT), await uint16(TIFFTAG_SAMPLESPERPIXEL)];
    if (bits !== 32 || format !== SAMPLEFORMAT_IEEEFP || bands !== 1 || (await TIFFIsTiled(tif))) throw new Error('not a one-band float32 TIFF in strips');
    const restored = new Uint8Array(rows * columns * 4);
    for (let y = 0; y < rows; y += 1) {
        if ((await TIFFReadScanline(tif, row, y, 0)) < 0) throw new Error(`libtiff could not read row ${y}`);
        restored.set(await readBuffer(row, columns * 4), y * columns * 4);
    }
    await TIFFClose(tif);
    console.log(restored.every((byte, i) => byte === samples[i]));

    // Whether TIFFReadRGBAImage could turn the image into display pixels, and if not, why not.
    tif = await open('r');
    const reason = await allocBuffer(1024);
    const convertible = await TIFFRGBAImageOK(tif, reason);
    await TIFFClose(tif);
    console.log(convertible ? 'TIFFReadRGBAImage can convert it' : await readCString(reason));
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
