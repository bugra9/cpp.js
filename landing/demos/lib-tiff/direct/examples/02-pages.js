export const imports = {
    '@crossbind/port-tiff/tiffio.h': [
        'TIFFClientOpen',
        'TIFFSetField',
        'TIFFGetField',
        'TIFFGetFieldDefaulted',
        'TIFFWriteScanline',
        'TIFFWriteDirectory',
        'TIFFReadDirectory',
        'TIFFCurrentDirectory',
        'TIFFSetDirectory',
        'TIFFScanlineSize',
        'TIFFReadScanline',
        'TIFFFindCODEC',
        'TIFFClose',
        'allocBuffer',
        'allocPointer',
        'readBuffer',
        'writeBuffer',
        'readNumberAt',
        'readPointerAt',
        'readCString',
        'releaseCallback',
    ],
    '@crossbind/port-tiff/tiff.h': [
        'TIFFTAG_SUBFILETYPE',
        'TIFFTAG_IMAGEWIDTH',
        'TIFFTAG_IMAGELENGTH',
        'TIFFTAG_BITSPERSAMPLE',
        'TIFFTAG_SAMPLESPERPIXEL',
        'TIFFTAG_PHOTOMETRIC',
        'TIFFTAG_COMPRESSION',
        'TIFFTAG_ROWSPERSTRIP',
        'TIFFTAG_PAGENUMBER',
        'TIFFTAG_PAGENAME',
        'FILETYPE_PAGE',
        'PHOTOMETRIC_MINISWHITE',
        'COMPRESSION_CCITTFAX4',
    ],
};
export const note = 'The C++ keeps the document in memory with `TIFFClientOpen` too, and so does JavaScript, with its callbacks as JavaScript functions over a `Uint8Array`, which keeps the module on the page\'s thread. Each page is set up with the variadic `TIFFSetField`, the page number with its two extra arguments and the name as a JavaScript string that libtiff copies. `TIFFGetField` hands the name back as a `char *` written into an `allocPointer` slot, read with `readPointerAt` and `readCString`, and the 1-bit rows are packed and unpacked in JavaScript.';
export const expected = [
    '3 pages in 6133 B',
    'page 1 "cover": 240x320, CCITT Group 4',
    'page 2 "summary": 240x320, CCITT Group 4',
    'page 3 "appendix": 240x320, CCITT Group 4',
    'true',
];
export const init = { useWorker: false };

export default async function example({ TIFFClientOpen, TIFFSetField, TIFFGetField, TIFFGetFieldDefaulted, TIFFWriteScanline, TIFFWriteDirectory, TIFFReadDirectory, TIFFCurrentDirectory, TIFFSetDirectory, TIFFScanlineSize, TIFFReadScanline, TIFFFindCODEC, TIFFClose, allocBuffer, allocPointer, readBuffer, writeBuffer, readNumberAt, readPointerAt, readCString, releaseCallback, TIFFTAG_SUBFILETYPE, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_PHOTOMETRIC, TIFFTAG_COMPRESSION, TIFFTAG_ROWSPERSTRIP, TIFFTAG_PAGENUMBER, TIFFTAG_PAGENAME, FILETYPE_PAGE, PHOTOMETRIC_MINISWHITE, COMPRESSION_CCITTFAX4 }, console) {
    const width = 240;
    const height = 320;
    const names = ['cover', 'summary', 'appendix'];
    const pages = names.map((name, index) => {
        let grey = ''; // one byte per pixel: a checkerboard whose squares widen page by page
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) grey += String.fromCharCode(((x >> (index + 2)) + (y >> 4)) % 2 ? 0 : 255);
        }
        return grey;
    });

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

    // Every page is a directory: its tags, its rows of 1-bit pixels (a set bit is black), then TIFFWriteDirectory.
    let tif = await open('w');
    const row = await allocBuffer((width + 7) >> 3);
    for (const [index, name] of names.entries()) {
        await TIFFSetField(tif, TIFFTAG_SUBFILETYPE, FILETYPE_PAGE);
        await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, width);
        await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, height);
        await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 1);
        await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
        await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISWHITE);
        await TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_CCITTFAX4);
        await TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, height);
        await TIFFSetField(tif, TIFFTAG_PAGENUMBER, index, 0); // 0: the page count is not known yet
        await TIFFSetField(tif, TIFFTAG_PAGENAME, name);
        for (let y = 0; y < height; y += 1) {
            const bits = new Uint8Array((width + 7) >> 3); // below 128 is black
            for (let x = 0; x < width; x += 1) {
                if (pages[index].charCodeAt(y * width + x) < 128) bits[x >> 3] |= 0x80 >> (x & 7);
            }
            await writeBuffer(row, bits);
            if ((await TIFFWriteScanline(tif, row, y, 0)) < 0) throw new Error(`libtiff could not write row ${y}`);
        }
        if (!(await TIFFWriteDirectory(tif))) throw new Error(`libtiff could not finish page ${index + 1}`);
    }
    await TIFFClose(tif);
    console.log(`${names.length} pages in ${file.length} B`);

    // One line per page: its number, name, size and codec.
    tif = await open('r');
    const value = await allocBuffer(4);
    const text = await allocPointer(1); // TIFFTAG_PAGENAME comes back as a char *
    do {
        await TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, value);
        const pageWidth = await readNumberAt(value, 0, 'uint32');
        await TIFFGetField(tif, TIFFTAG_IMAGELENGTH, value);
        const pageHeight = await readNumberAt(value, 0, 'uint32');
        await TIFFGetFieldDefaulted(tif, TIFFTAG_COMPRESSION, value);
        const codec = await TIFFFindCODEC(await readNumberAt(value, 0, 'uint16'));
        const name = (await TIFFGetField(tif, TIFFTAG_PAGENAME, text)) ? await readCString(await readPointerAt(text, 0)) : '';
        console.log(`page ${(await TIFFCurrentDirectory(tif)) + 1} "${name}": ${pageWidth}x${pageHeight}, ${codec ? await readCString(await codec.name) : '?'}`);
    } while (await TIFFReadDirectory(tif));
    await TIFFClose(tif);

    // Page 3 back as 8-bit grey, black 0 and white 255, read with TIFFReadScanline.
    tif = await open('r');
    if (!(await TIFFSetDirectory(tif, 2))) throw new Error('there is no page 3');
    const line = await allocBuffer(await TIFFScanlineSize(tif));
    let grey = '';
    for (let y = 0; y < height; y += 1) {
        if ((await TIFFReadScanline(tif, line, y, 0)) < 0) throw new Error(`libtiff could not read row ${y}`);
        const bits = await readBuffer(line, (width + 7) >> 3);
        for (let x = 0; x < width; x += 1) grey += String.fromCharCode(bits[x >> 3] & (0x80 >> (x & 7)) ? 0 : 255);
    }
    await TIFFClose(tif);
    console.log(grey === pages[2]);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
