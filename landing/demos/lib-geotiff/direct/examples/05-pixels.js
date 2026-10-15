export const imports = {
    '@crossbind/port-geotiff/geotiff.h': ['GTIFNew', 'GTIFKeySet', 'GTIFWriteKeys', 'GTIFImageToPCS', 'GTIFPCSToImage', 'GTIFFree', 'tagtype_t', 'allocBuffer', 'readBuffer', 'writeBuffer', 'readNumberAt', 'writeNumberAt', 'releaseCallback'],
    '@crossbind/port-geotiff/geo_normalize.h': ['GTIFAllocDefn', 'GTIFGetDefn', 'GTIFProj4FromLatLong', 'GTIFProj4ToLatLong', 'GTIFFreeDefn'],
    '@crossbind/port-geotiff/geokeys.h': ['geokey_t'],
    '@crossbind/port-geotiff/geovalues.h': ['modeltype_t', 'rastertype_t'],
    '@crossbind/port-geotiff/xtiffio.h': ['XTIFFClientOpen', 'XTIFFClose', 'TIFFTAG_GEOTIEPOINTS', 'TIFFTAG_GEOPIXELSCALE'],
    '@crossbind/port-tiff/tiffio.h': ['TIFFSetField', 'TIFFWriteScanline'],
    '@crossbind/port-tiff/tiff.h': ['TIFFTAG_IMAGEWIDTH', 'TIFFTAG_IMAGELENGTH', 'TIFFTAG_BITSPERSAMPLE', 'TIFFTAG_SAMPLESPERPIXEL', 'TIFFTAG_PHOTOMETRIC', 'TIFFTAG_ROWSPERSTRIP', 'PHOTOMETRIC_MINISBLACK'],
};
export const note = 'The same four conversions the C++ makes, on a definition `GTIFGetDefn` fills in C and JavaScript only passes on, each point converted in place in two 8-byte `allocBuffer`s. The file is written as in the first example and stays open between the two questions, as the C++ class keeps it.';
export const expected = ['Galata Tower: 665970.23, 4543502.03 m, pixel 159.702, 164.980', 'centre of pixel 159, 164: 665950, 4543550 m, 28.973939, 41.026269'];
export const init = { useWorker: false };

export default async function example({ GTIFNew, GTIFKeySet, GTIFWriteKeys, GTIFImageToPCS, GTIFPCSToImage, GTIFFree, tagtype_t, allocBuffer, readBuffer, writeBuffer, readNumberAt, writeNumberAt, releaseCallback, GTIFAllocDefn, GTIFGetDefn, GTIFProj4FromLatLong, GTIFProj4ToLatLong, GTIFFreeDefn, geokey_t, modeltype_t, rastertype_t, XTIFFClientOpen, XTIFFClose, TIFFTAG_GEOTIEPOINTS, TIFFTAG_GEOPIXELSCALE, TIFFSetField, TIFFWriteScanline, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_PHOTOMETRIC, TIFFTAG_ROWSPERSTRIP, PHOTOMETRIC_MINISBLACK }, console) {
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

    // 300 x 300 pixels of 100 m over Istanbul in WGS 84 / UTM zone 35N, written as in the first example
    const [epsg, width, height, x, y, pixelSize] = [32635, 300, 300, 650000, 4560000, 100];
    let tif = await open('sample.tif', 'w');
    await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, width);
    await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, height);
    await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
    await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISBLACK);
    await TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, height);
    const tiepoint = await allocBuffer(6 * 8);
    await writeBuffer(tiepoint, new Float64Array([0, 0, 0, x, y, 0]));
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
    const row = await allocBuffer(width);
    for (let line = 0; line < height; line += 1) {
        if ((await TIFFWriteScanline(tif, row, line, 0)) < 0) throw new Error('libtiff could not write a row');
    }
    await XTIFFClose(tif);

    // The file stays open between questions, as the C++ class keeps it.
    tif = await open('input.tif', 'r');
    gtif = await GTIFNew(tif);
    const defn = await GTIFAllocDefn();
    if (!gtif || !(await GTIFGetDefn(gtif, defn))) throw new Error('no coordinate system in the GeoKeys');
    const [pointX, pointY] = [await allocBuffer(8), await allocBuffer(8)]; // each function converts x and y in place
    const put = async (a, b) => {
        await writeNumberAt(pointX, 0, 'float64', a);
        await writeNumberAt(pointY, 0, 'float64', b);
    };
    const take = async () => [await readNumberAt(pointX, 0, 'float64'), await readNumberAt(pointY, 0, 'float64')];

    await put(28.974167, 41.025833); // Galata Tower, longitude and latitude
    if (!(await GTIFProj4FromLatLong(defn, 1, pointX, pointY))) throw new Error('PROJ could not project the point');
    const map = await take();
    if (!(await GTIFPCSToImage(gtif, pointX, pointY))) throw new Error('no tiepoint and pixel scale to place the pixels');
    const pixel = await take();
    console.log(`Galata Tower: ${map.map((v) => v.toFixed(2)).join(', ')} m, pixel ${pixel.map((v) => v.toFixed(3)).join(', ')}`);

    const [column, line] = pixel.map(Math.floor);
    await put(column + 0.5, line + 0.5);
    if (!(await GTIFImageToPCS(gtif, pointX, pointY))) throw new Error('no tiepoint and pixel scale to place the pixels');
    const centre = await take();
    if (!(await GTIFProj4ToLatLong(defn, 1, pointX, pointY))) throw new Error('PROJ could not unproject the point');
    const lonLat = await take();
    console.log(`centre of pixel ${column}, ${line}: ${centre.join(', ')} m, ${lonLat.map((v) => v.toFixed(6)).join(', ')}`);
    await GTIFFreeDefn(defn);
    await GTIFFree(gtif);
    await XTIFFClose(tif);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
