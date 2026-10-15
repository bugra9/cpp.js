export const imports = {
    '@crossbind/port-tiff/tiffio.h': [
        'TIFFClientOpen',
        'TIFFSetField',
        'TIFFGetField',
        'TIFFTileSize',
        'TIFFWriteTile',
        'TIFFNumberOfTiles',
        'TIFFCheckTile',
        'TIFFComputeTile',
        'TIFFReadTile',
        'TIFFClose',
        'allocBuffer',
        'readBuffer',
        'writeBuffer',
        'readNumberAt',
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
        'TIFFTAG_TILEWIDTH',
        'TIFFTAG_TILELENGTH',
        'PHOTOMETRIC_RGB',
        'PLANARCONFIG_CONTIG',
        'COMPRESSION_ADOBE_DEFLATE',
    ],
};
export const note = 'The tile layout is two more `TIFFSetField` tags, and the variadic `TIFFGetField` reads them back. JavaScript cuts each 128 x 128 tile out of the RGBA pixels itself and hands it to `TIFFWriteTile` through an `allocBuffer`; `TIFFReadTile` then decodes the one tile under the pixel into another, which `readBuffer` copies out. The file is a `Uint8Array` behind `TIFFClientOpen`\'s JavaScript callbacks, as in the first example, so the module runs on the page\'s thread.';
export const expected = ['512x512 in 16 tiles of 128x128, 239648 B', 'pixel (300, 200) is in tile 6, decoded alone: 49152 B', 'rgb(150, 100, 125)'];
export const init = { useWorker: false };

export default async function example({ TIFFClientOpen, TIFFSetField, TIFFGetField, TIFFTileSize, TIFFWriteTile, TIFFNumberOfTiles, TIFFCheckTile, TIFFComputeTile, TIFFReadTile, TIFFClose, allocBuffer, readBuffer, writeBuffer, readNumberAt, releaseCallback, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_BITSPERSAMPLE, TIFFTAG_PHOTOMETRIC, TIFFTAG_PLANARCONFIG, TIFFTAG_COMPRESSION, TIFFTAG_TILEWIDTH, TIFFTAG_TILELENGTH, PHOTOMETRIC_RGB, PLANARCONFIG_CONTIG, COMPRESSION_ADOBE_DEFLATE }, console) {
    const size = 512;
    let rgba = '';
    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) rgba += String.fromCharCode(x >> 1, y >> 1, (x + y) >> 2, 255);
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

    // 8-bit RGB in square Deflate tiles, each cut out of the RGBA pixels.
    const tileSize = 128;
    let tif = await open('w');
    await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, size);
    await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, size);
    await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 3);
    await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_RGB);
    await TIFFSetField(tif, TIFFTAG_PLANARCONFIG, PLANARCONFIG_CONTIG);
    await TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_ADOBE_DEFLATE);
    await TIFFSetField(tif, TIFFTAG_TILEWIDTH, tileSize);
    await TIFFSetField(tif, TIFFTAG_TILELENGTH, tileSize);
    const tileBytes = await TIFFTileSize(tif);
    const tile = await allocBuffer(tileBytes);
    for (let top = 0; top < size; top += tileSize) {
        for (let left = 0; left < size; left += tileSize) {
            const rgb = new Uint8Array(tileBytes); // edge tiles are padded
            for (let y = top; y < Math.min(top + tileSize, size); y += 1) {
                for (let x = left; x < Math.min(left + tileSize, size); x += 1) {
                    for (let channel = 0; channel < 3; channel += 1) rgb[((y - top) * tileSize + (x - left)) * 3 + channel] = rgba.charCodeAt((y * size + x) * 4 + channel);
                }
            }
            await writeBuffer(tile, rgb);
            if ((await TIFFWriteTile(tif, tile, left, top, 0, 0)) < 0) throw new Error(`libtiff could not write the tile at ${left},${top}`);
        }
    }
    await TIFFClose(tif);

    tif = await open('r');
    const value = await allocBuffer(4);
    const uint32 = async (tag) => (await TIFFGetField(tif, tag, value)) && readNumberAt(value, 0, 'uint32');
    const layout = `${await uint32(TIFFTAG_IMAGEWIDTH)}x${await uint32(TIFFTAG_IMAGELENGTH)} in ${await TIFFNumberOfTiles(tif)} tiles of ${await uint32(TIFFTAG_TILEWIDTH)}x${await uint32(TIFFTAG_TILELENGTH)}`;
    console.log(`${layout}, ${file.length} B`);

    // The tile that holds pixel (x, y), decoded with TIFFReadTile; no other tile is read.
    const [x, y] = [300, 200];
    if (!(await TIFFCheckTile(tif, x, y, 0, 0))) throw new Error('the pixel is outside the image');
    const index = await TIFFComputeTile(tif, x, y, 0, 0);
    const decoded = await allocBuffer(await TIFFTileSize(tif));
    const length = await TIFFReadTile(tif, decoded, x, y, 0, 0);
    await TIFFClose(tif);
    if (length < 0) throw new Error('libtiff could not read the tile');
    const samples = await readBuffer(decoded, length); // RGB, 128 x 128 x 3 bytes
    const at = ((y % 128) * 128 + (x % 128)) * 3;
    console.log(`pixel (${x}, ${y}) is in tile ${index}, decoded alone: ${samples.length} B`);
    console.log(`rgb(${[0, 1, 2].map((channel) => samples[at + channel]).join(', ')})`);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
