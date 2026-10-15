export const imports = {
    '@crossbind/port-geotiff/geotiff.h': ['GTIFNew', 'GTIFKeySet', 'GTIFWriteKeys', 'GTIFPrint', 'GTIFFree', 'tagtype_t', 'allocBuffer', 'readBuffer', 'writeBuffer', 'readCString', 'releaseCallback'],
    '@crossbind/port-geotiff/geokeys.h': ['geokey_t'],
    '@crossbind/port-geotiff/geovalues.h': ['modeltype_t', 'rastertype_t', 'geographic_t', 'geounits_t'],
    '@crossbind/port-geotiff/xtiffio.h': ['XTIFFClientOpen', 'XTIFFClose', 'TIFFTAG_GEOTIEPOINTS', 'TIFFTAG_GEOPIXELSCALE'],
    '@crossbind/port-tiff/tiffio.h': ['TIFFSetField', 'TIFFWriteScanline'],
    '@crossbind/port-tiff/tiff.h': [
        'TIFFTAG_IMAGEWIDTH',
        'TIFFTAG_IMAGELENGTH',
        'TIFFTAG_BITSPERSAMPLE',
        'TIFFTAG_SAMPLESPERPIXEL',
        'TIFFTAG_PHOTOMETRIC',
        'TIFFTAG_COMPRESSION',
        'TIFFTAG_PREDICTOR',
        'TIFFTAG_ROWSPERSTRIP',
        'PHOTOMETRIC_MINISBLACK',
        'COMPRESSION_ADOBE_DEFLATE',
        'PREDICTOR_HORIZONTAL',
    ],
};
export const note = 'The first example\'s writer with Deflate, a predictor and a citation, which `GTIFKeySet` takes as a JavaScript string and copies; the EPSG codes are members of the `geographic_t` and `geounits_t` enums. `GTIFPrint` hands listgeo\'s text to a JavaScript function a piece at a time, as a `char *` read with `readCString`, so this callback too needs the page\'s thread.';
export const expected = [
    '256 x 128 pixels: 32768 B, 23246 B as a Deflate GeoTIFF',
    'Geotiff_Information:',
    '   Version: 1',
    '   Key_Revision: 1.0',
    '   Tagged_Information:',
    '      ModelTiepointTag (2,3):',
    '         0                 0                 0',
    '         -10               60                0',
    '      ModelPixelScaleTag (1,3):',
    '         0.15625           0.1953125         0',
    '      End_Of_Tags.',
    '   Keyed_Information:',
    '      GTModelTypeGeoKey (Short,1): ModelTypeGeographic',
    '      GTRasterTypeGeoKey (Short,1): RasterPixelIsArea',
    '      GTCitationGeoKey (Ascii,25): "Europe, synthetic relief"',
    '      GeographicTypeGeoKey (Short,1): GCS_WGS_84',
    '      GeogAngularUnitsGeoKey (Short,1): Angular_Degree',
    '      End_Of_Keys.',
    '   End_Of_Geotiff.',
];
export const init = { useWorker: false };

export default async function example({ GTIFNew, GTIFKeySet, GTIFWriteKeys, GTIFPrint, GTIFFree, tagtype_t, allocBuffer, readBuffer, writeBuffer, readCString, releaseCallback, geokey_t, modeltype_t, rastertype_t, geographic_t, geounits_t, XTIFFClientOpen, XTIFFClose, TIFFTAG_GEOTIEPOINTS, TIFFTAG_GEOPIXELSCALE, TIFFSetField, TIFFWriteScanline, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_PHOTOMETRIC, TIFFTAG_COMPRESSION, TIFFTAG_PREDICTOR, TIFFTAG_ROWSPERSTRIP, PHOTOMETRIC_MINISBLACK, COMPRESSION_ADOBE_DEFLATE, PREDICTOR_HORIZONTAL }, console) {
    const [width, height] = [256, 128];
    let seed = 11;
    const noise = () => (seed = (seed * 48271) % 2147483647) % 24;
    const relief = (x, y) => 60 + 2 * Math.abs((x % 64) - 32) + 2 * Math.abs((y % 48) - 24) + noise(); // ridges and noise
    const pixels = Uint8Array.from({ length: width * height }, (_, i) => relief(i % width, Math.floor(i / width)));

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

    // 10 W to 30 E and 35 N to 60 N, in WGS 84 degrees
    const [west, south, east, north] = [-10, 35, 30, 60];
    let tif = await open('grey.tif', 'w');
    await TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, width);
    await TIFFSetField(tif, TIFFTAG_IMAGELENGTH, height);
    await TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    await TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
    await TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISBLACK);
    await TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_ADOBE_DEFLATE);
    await TIFFSetField(tif, TIFFTAG_PREDICTOR, PREDICTOR_HORIZONTAL);
    await TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, 16);
    const tiepoint = await allocBuffer(6 * 8);
    await writeBuffer(tiepoint, new Float64Array([0, 0, 0, west, north, 0]));
    const scale = await allocBuffer(3 * 8);
    await writeBuffer(scale, new Float64Array([(east - west) / width, (north - south) / height, 0]));
    await TIFFSetField(tif, TIFFTAG_GEOTIEPOINTS, 6, tiepoint);
    await TIFFSetField(tif, TIFFTAG_GEOPIXELSCALE, 3, scale);
    let gtif = await GTIFNew(tif);
    await GTIFKeySet(gtif, geokey_t.GTModelTypeGeoKey, tagtype_t.TYPE_SHORT, 1, modeltype_t.ModelTypeGeographic);
    await GTIFKeySet(gtif, geokey_t.GTRasterTypeGeoKey, tagtype_t.TYPE_SHORT, 1, rastertype_t.RasterPixelIsArea);
    await GTIFKeySet(gtif, geokey_t.GTCitationGeoKey, tagtype_t.TYPE_ASCII, 0, 'Europe, synthetic relief');
    await GTIFKeySet(gtif, geokey_t.GeographicTypeGeoKey, tagtype_t.TYPE_SHORT, 1, geographic_t.GCS_WGS_84);
    await GTIFKeySet(gtif, geokey_t.GeogAngularUnitsGeoKey, tagtype_t.TYPE_SHORT, 1, geounits_t.Angular_Degree);
    await GTIFWriteKeys(gtif);
    await GTIFFree(gtif);
    const row = await allocBuffer(width);
    for (let y = 0; y < height; y += 1) {
        await writeBuffer(row, pixels.subarray(y * width, (y + 1) * width));
        if ((await TIFFWriteScanline(tif, row, y, 0)) < 0) throw new Error('libtiff could not write a row');
    }
    await XTIFFClose(tif);
    console.log(`${width} x ${height} pixels: ${pixels.length} B, ${file.length} B as a Deflate GeoTIFF`);

    // GTIFPrint: the key and tag dump listgeo starts with, handed to a callback piece by piece.
    tif = await open('input.tif', 'r');
    gtif = await GTIFNew(tif);
    let text = '';
    const append = (message) => {
        text += readCString(message);
        return 1;
    };
    await GTIFPrint(gtif, append, null);
    await GTIFFree(gtif);
    await XTIFFClose(tif);
    for (const line of text.trimEnd().split('\n')) console.log(line.trimEnd());
    for (const proc of [read, write, seek, close, fileSize, append]) await releaseCallback(proc);
}
