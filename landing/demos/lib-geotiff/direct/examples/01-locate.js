export const imports = {
    '@crossbind/port-geotiff/geotiff.h': [
        'LIBGEOTIFF_STRING_VERSION',
        'GTIFNew',
        'GTIFKeySet',
        'GTIFWriteKeys',
        'GTIFImageToPCS',
        'GTIFFree',
        'tagtype_t',
        'allocBuffer',
        'allocPointer',
        'readBuffer',
        'writeBuffer',
        'readNumberAt',
        'writeNumberAt',
        'readPointerAt',
        'readCString',
        'releaseCallback',
    ],
    '@crossbind/port-geotiff/geo_normalize.h': ['GTIFAllocDefn', 'GTIFGetDefn', 'GTIFProj4ToLatLong', 'GTIFGetPCSInfo', 'GTIFFreeMemory', 'GTIFFreeDefn'],
    '@crossbind/port-geotiff/geokeys.h': ['geokey_t'],
    '@crossbind/port-geotiff/geovalues.h': ['modeltype_t', 'rastertype_t'],
    '@crossbind/port-geotiff/xtiffio.h': ['XTIFFClientOpen', 'XTIFFClose', 'TIFFTAG_GEOTIEPOINTS', 'TIFFTAG_GEOPIXELSCALE'],
    '@crossbind/port-tiff/tiffio.h': ['TIFFSetField', 'TIFFGetField', 'TIFFWriteScanline'],
    '@crossbind/port-tiff/tiff.h': ['TIFFTAG_IMAGEWIDTH', 'TIFFTAG_IMAGELENGTH', 'TIFFTAG_BITSPERSAMPLE', 'TIFFTAG_SAMPLESPERPIXEL', 'TIFFTAG_PHOTOMETRIC', 'TIFFTAG_ROWSPERSTRIP', 'PHOTOMETRIC_MINISBLACK'],
};
export const note = 'The same calls as the C++ on a file kept in memory: `TIFFStreamOpen` takes a C++ stream, so `XTIFFClientOpen` reads, writes and seeks a `Uint8Array` through JavaScript callbacks, which keeps the module on the page\'s thread. The variadic `TIFFSetField` and `GTIFKeySet` bind when imported by name: the tiepoint and the pixel scale go in as a `Float64Array` copied into an `allocBuffer`, and each key and its type as members of `geokey_t` and `tagtype_t`, with a value from `modeltype_t` or `rastertype_t`, or a number for the EPSG code as in the C++. The EPSG code is the `PCS` field of `GTIFDefn`, and the version is the `LIBGEOTIFF_STRING_VERSION` macro, imported as a string.';
export const expected = ({ geotiff }) => [
    `libgeotiff ${geotiff}, 10262 B: EPSG:32633 WGS 84 / UTM zone 33N, 100 x 100 pixels`,
    'upper left 500000, 4650000 = 15.000000 E, 42.002015 N',
    'lower right 503000, 4647000 = 15.036210 E, 41.974990 N',
];
export const init = { useWorker: false };

export default async function example({ LIBGEOTIFF_STRING_VERSION, GTIFNew, GTIFKeySet, GTIFWriteKeys, GTIFImageToPCS, GTIFFree, tagtype_t, allocBuffer, allocPointer, readBuffer, writeBuffer, readNumberAt, writeNumberAt, readPointerAt, readCString, releaseCallback, GTIFAllocDefn, GTIFGetDefn, GTIFProj4ToLatLong, GTIFGetPCSInfo, GTIFFreeMemory, GTIFFreeDefn, geokey_t, modeltype_t, rastertype_t, XTIFFClientOpen, XTIFFClose, TIFFTAG_GEOTIEPOINTS, TIFFTAG_GEOPIXELSCALE, TIFFSetField, TIFFGetField, TIFFWriteScanline, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_PHOTOMETRIC, TIFFTAG_ROWSPERSTRIP, PHOTOMETRIC_MINISBLACK }, console) {
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
    const open = (name, mode) => {
        if (mode === 'w') file = new Uint8Array(0);
        position = 0;
        return XTIFFClientOpen(name, mode, null, read, write, seek, close, fileSize, null, null);
    };

    // 100 x 100 blank pixels of 30 m in WGS 84 / UTM zone 33N, the upper-left corner at 500000, 4650000
    const [epsg, width, height, x, y, pixelSize] = [32633, 100, 100, 500000, 4650000, 30];
    let tif = await open('sample.tif', 'w');
    await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, width);
    await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, height);
    await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
    await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISBLACK);
    await TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, height);
    const tiepoint = await allocBuffer(6 * 8);
    await writeBuffer(tiepoint, new Float64Array([0, 0, 0, x, y, 0])); // pixel (0, 0) sits at map (x, y)
    const scale = await allocBuffer(3 * 8);
    await writeBuffer(scale, new Float64Array([pixelSize, pixelSize, 0]));
    await TIFFSetField(tif, TIFFTAG_GEOTIEPOINTS, 6, tiepoint);
    await TIFFSetField(tif, TIFFTAG_GEOPIXELSCALE, 3, scale);
    let gtif = await GTIFNew(tif);
    await GTIFKeySet(gtif, geokey_t.GTModelTypeGeoKey, tagtype_t.TYPE_SHORT, 1, modeltype_t.ModelTypeProjected);
    await GTIFKeySet(gtif, geokey_t.GTRasterTypeGeoKey, tagtype_t.TYPE_SHORT, 1, rastertype_t.RasterPixelIsArea);
    await GTIFKeySet(gtif, geokey_t.ProjectedCSTypeGeoKey, tagtype_t.TYPE_SHORT, 1, epsg);
    await GTIFWriteKeys(gtif);
    await GTIFFree(gtif);
    const row = await allocBuffer(width); // zeroed, so every row is blank
    for (let line = 0; line < height; line += 1) {
        if ((await TIFFWriteScanline(tif, row, line, 0)) < 0) throw new Error('libtiff could not write a row');
    }
    await XTIFFClose(tif);

    // The coordinate system from the GeoKeys, then two corners in map coordinates and in degrees.
    tif = await open('input.tif', 'r');
    gtif = await GTIFNew(tif);
    const defn = await GTIFAllocDefn();
    if (!gtif || !(await GTIFGetDefn(gtif, defn))) throw new Error('no coordinate system in the GeoKeys');
    const value = await allocBuffer(4);
    await TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, value);
    const pixelsWide = await readNumberAt(value, 0, 'uint32');
    await TIFFGetField(tif, TIFFTAG_IMAGELENGTH, value);
    const pixelsHigh = await readNumberAt(value, 0, 'uint32');
    const [pointX, pointY] = [await allocBuffer(8), await allocBuffer(8)]; // GTIFImageToPCS converts them in place
    const map = [];
    for (const [column, line] of [[0, 0], [pixelsWide, pixelsHigh]]) {
        await writeNumberAt(pointX, 0, 'float64', column);
        await writeNumberAt(pointY, 0, 'float64', line);
        if (!(await GTIFImageToPCS(gtif, pointX, pointY))) throw new Error('no tiepoint and pixel scale to place the pixels');
        map.push([await readNumberAt(pointX, 0, 'float64'), await readNumberAt(pointY, 0, 'float64')]);
    }
    const [lon, lat] = [await allocBuffer(2 * 8), await allocBuffer(2 * 8)]; // both corners in one call
    await writeBuffer(lon, new Float64Array(map.map(([mapX]) => mapX)));
    await writeBuffer(lat, new Float64Array(map.map(([, mapY]) => mapY)));
    if (!(await GTIFProj4ToLatLong(defn, 2, lon, lat))) throw new Error('PROJ could not unproject the corners');

    const name = await allocPointer(1);
    await GTIFGetPCSInfo(await defn.PCS, name, null, null, null);
    const text = await readPointerAt(name, 0); // a C string GTIFFreeMemory releases
    console.log(`libgeotiff ${LIBGEOTIFF_STRING_VERSION}, ${file.length} B: EPSG:${await defn.PCS} ${await readCString(text)}, ${pixelsWide} x ${pixelsHigh} pixels`);
    await GTIFFreeMemory(text);
    const degrees = async (corner) => `${(await readNumberAt(lon, corner, 'float64')).toFixed(6)} E, ${(await readNumberAt(lat, corner, 'float64')).toFixed(6)} N`;
    console.log(`upper left ${map[0].join(', ')} = ${await degrees(0)}`);
    console.log(`lower right ${map[1].join(', ')} = ${await degrees(1)}`);
    await GTIFFreeDefn(defn);
    await GTIFFree(gtif);
    await XTIFFClose(tif);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
