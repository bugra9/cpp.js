export const imports = {
    '@crossbind/port-tiff/tiffio.h': [
        'TIFFClientOpen',
        'TIFFSetField',
        'TIFFGetField',
        'TIFFGetFieldDefaulted',
        'TIFFDefaultStripSize',
        'TIFFWriteScanline',
        'TIFFNumberOfDirectories',
        'TIFFFindCODEC',
        'TIFFReadRGBAImageOriented',
        'TIFFClose',
        'allocBuffer',
        'readBuffer',
        'writeBuffer',
        'readBytes',
        'writeBytes',
        'readNumberAt',
        'readCString',
        'releaseCallback',
    ],
    '@crossbind/port-tiff/tiff.h': [
        'TIFFTAG_IMAGEWIDTH',
        'TIFFTAG_IMAGELENGTH',
        'TIFFTAG_SAMPLESPERPIXEL',
        'TIFFTAG_BITSPERSAMPLE',
        'TIFFTAG_PHOTOMETRIC',
        'TIFFTAG_PLANARCONFIG',
        'TIFFTAG_COMPRESSION',
        'TIFFTAG_ROWSPERSTRIP',
        'PHOTOMETRIC_RGB',
        'PLANARCONFIG_CONTIG',
        'COMPRESSION_LZW',
        'ORIENTATION_TOPLEFT',
    ],
    '@crossbind/port-tiff/tiffvers.h': ['TIFFLIB_VERSION_STR_MAJ_MIN_MIC'],
};
export const note = 'The same libtiff calls as the C++, `TIFFSetField` and `TIFFGetField` included: they are variadic, and an import by name binds them, each extra argument passed by its JavaScript type, a number as a C `long` and a handle as its pointer. `TIFFStreamOpen` takes a C++ stream, which JavaScript cannot make, so the file is a `Uint8Array` that `TIFFClientOpen` reads, writes and seeks through JavaScript callbacks, which only a module on the page\'s thread can hand to C. The tags, codes and version are `#define`s imported from `tiff.h` and `tiffvers.h`, and `TIFFFindCODEC` returns a `TIFFCodec` whose `name` reads as a handle for `readCString`.';
export const expected = ({ tiff }) => [`libtiff ${tiff}: 76800 B of RGBA -> 27692 B, starts with II*`, '160x120, 3 x 8-bit samples, LZW, 1 page', 'true'];
export const init = { useWorker: false };

export default async function example({ TIFFClientOpen, TIFFSetField, TIFFGetField, TIFFGetFieldDefaulted, TIFFDefaultStripSize, TIFFWriteScanline, TIFFNumberOfDirectories, TIFFFindCODEC, TIFFReadRGBAImageOriented, TIFFClose, allocBuffer, readBuffer, writeBuffer, readBytes, writeBytes, readNumberAt, readCString, releaseCallback, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_BITSPERSAMPLE, TIFFTAG_PHOTOMETRIC, TIFFTAG_PLANARCONFIG, TIFFTAG_COMPRESSION, TIFFTAG_ROWSPERSTRIP, PHOTOMETRIC_RGB, PLANARCONFIG_CONTIG, COMPRESSION_LZW, ORIENTATION_TOPLEFT, TIFFLIB_VERSION_STR_MAJ_MIN_MIC }, console) {
    const width = 160;
    const height = 120;
    let rgba = ''; // one character per byte, in the order ImageData uses
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) rgba += String.fromCharCode(x, 64 + (y >> 5) * 32, 255 - x, 255);
    }

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

    let tif = await open('w');
    await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, width);
    await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, height);
    await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 3);
    await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_RGB);
    await TIFFSetField(tif, TIFFTAG_PLANARCONFIG, PLANARCONFIG_CONTIG);
    await TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_LZW);
    await TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, await TIFFDefaultStripSize(tif, 0));
    const row = await allocBuffer(width * 3);
    for (let y = 0; y < height; y += 1) {
        let rgb = ''; // alpha is not stored
        for (let at = y * width * 4; at < (y + 1) * width * 4; at += 4) rgb += rgba.slice(at, at + 3);
        await writeBytes(row, rgb);
        if ((await TIFFWriteScanline(tif, row, y, 0)) < 0) throw new Error(`libtiff could not write row ${y}`);
    }
    await TIFFClose(tif);
    console.log(`libtiff ${TIFFLIB_VERSION_STR_MAJ_MIN_MIC}: ${rgba.length} B of RGBA -> ${file.length} B, starts with ${String.fromCharCode(...file.subarray(0, 3))}`);

    // TIFFGetField writes each value through a pointer: 32 bits for the size, 16 for the others.
    tif = await open('r');
    const value = await allocBuffer(4);
    const uint32 = async (tag) => (await TIFFGetField(tif, tag, value)) && readNumberAt(value, 0, 'uint32');
    const uint16 = async (tag) => (await TIFFGetFieldDefaulted(tif, tag, value)) && readNumberAt(value, 0, 'uint16');
    const [pixelsWide, pixelsHigh] = [await uint32(TIFFTAG_IMAGEWIDTH), await uint32(TIFFTAG_IMAGELENGTH)];
    const [samples, bits, compression] = [await uint16(TIFFTAG_SAMPLESPERPIXEL), await uint16(TIFFTAG_BITSPERSAMPLE), await uint16(TIFFTAG_COMPRESSION)];
    const pages = await TIFFNumberOfDirectories(tif);
    await TIFFClose(tif);
    const codec = await TIFFFindCODEC(compression);
    const codecName = codec ? await readCString(await codec.name) : `compression ${compression}`;
    console.log(`${pixelsWide}x${pixelsHigh}, ${samples} x ${bits}-bit samples, ${codecName}, ${pages} ${pages === 1 ? 'page' : 'pages'}`);

    // The first page as RGBA, top row first: each packed pixel holds R, G, B and A in memory order.
    tif = await open('r');
    const raster = await allocBuffer(pixelsWide * pixelsHigh * 4);
    const decoded = await TIFFReadRGBAImageOriented(tif, pixelsWide, pixelsHigh, raster, ORIENTATION_TOPLEFT, 0);
    await TIFFClose(tif);
    if (!decoded) throw new Error('libtiff cannot convert this page to RGBA');
    console.log((await readBytes(raster, pixelsWide * pixelsHigh * 4)) === rgba);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
