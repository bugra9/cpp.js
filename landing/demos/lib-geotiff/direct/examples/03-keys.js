export const imports = {
    '@crossbind/port-geotiff/geotiff.h': [
        'GTIFNew',
        'GTIFKeySet',
        'GTIFWriteKeys',
        'GTIFDirectoryInfo',
        'GTIFKeyInfo',
        'GTIFKeyName',
        'GTIFTypeName',
        'GTIFKeyGetASCII',
        'GTIFKeyGetSHORT',
        'GTIFValueNameEx',
        'GTIFFree',
        'tagtype_t',
        'allocBuffer',
        'allocPointer',
        'readBuffer',
        'writeBuffer',
        'readNumberAt',
        'readPointerAt',
        'readCString',
        'releaseCallback',
    ],
    '@crossbind/port-geotiff/geokeys.h': ['geokey_t'],
    '@crossbind/port-geotiff/geovalues.h': ['modeltype_t', 'rastertype_t', 'geographic_t', 'geounits_t'],
    '@crossbind/port-geotiff/xtiffio.h': ['XTIFFClientOpen', 'XTIFFClose', 'TIFFTAG_GEOTIEPOINTS', 'TIFFTAG_GEOPIXELSCALE'],
    '@crossbind/port-tiff/tiffio.h': ['TIFFSetField', 'TIFFGetField', 'TIFFWriteScanline'],
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
export const note = 'The file comes from the previous example\'s writer, and its keys are read back one at a time the way the C++ reads them: each one a member of `geokey_t`, its type compared with `tagtype_t.TYPE_ASCII.value`. The tiepoint and the pixel scale come from the variadic `TIFFGetField`, which writes the count into a 2-byte `allocBuffer` and a `double *` into an `allocPointer` slot, read with `readPointerAt` and `readNumberAt`.';
export const expected = [
    'GeoTIFF 1, key revision 1.0, 5 keys',
    'GTModelTypeGeoKey (Short): 2 = ModelTypeGeographic',
    'GTRasterTypeGeoKey (Short): 1 = RasterPixelIsArea',
    'GTCitationGeoKey (Ascii): "Europe"',
    'GeographicTypeGeoKey (Short): 4326 = GCS_WGS_84',
    'GeogAngularUnitsGeoKey (Short): 9102 = Angular_Degree',
    'tiepoint: pixel 0, 0 is at -10, 60; pixel scale: 0.625 x 0.78125',
];
export const init = { useWorker: false };

export default async function example({ GTIFNew, GTIFKeySet, GTIFWriteKeys, GTIFDirectoryInfo, GTIFKeyInfo, GTIFKeyName, GTIFTypeName, GTIFKeyGetASCII, GTIFKeyGetSHORT, GTIFValueNameEx, GTIFFree, tagtype_t, allocBuffer, allocPointer, readBuffer, writeBuffer, readNumberAt, readPointerAt, readCString, releaseCallback, geokey_t, modeltype_t, rastertype_t, geographic_t, geounits_t, XTIFFClientOpen, XTIFFClose, TIFFTAG_GEOTIEPOINTS, TIFFTAG_GEOPIXELSCALE, TIFFSetField, TIFFGetField, TIFFWriteScanline, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_PHOTOMETRIC, TIFFTAG_COMPRESSION, TIFFTAG_PREDICTOR, TIFFTAG_ROWSPERSTRIP, PHOTOMETRIC_MINISBLACK, COMPRESSION_ADOBE_DEFLATE, PREDICTOR_HORIZONTAL }, console) {
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

    // The previous example's writer: 64 x 32 pixels from 10 W to 30 E and 35 N to 60 N
    const [width, height, west, south, east, north] = [64, 32, -10, 35, 30, 60];
    const pixels = Uint8Array.from({ length: width * height }, (_, i) => (i * 7) % 256);
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
    await GTIFKeySet(gtif, geokey_t.GTCitationGeoKey, tagtype_t.TYPE_ASCII, 0, 'Europe');
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

    // The keys one at a time, as GDAL and most readers do: GTIFKeyInfo says whether a key is set and what
    // type it has, GTIFKeyGetASCII and GTIFKeyGetSHORT copy its value out.
    tif = await open('input.tif', 'r');
    gtif = await GTIFNew(tif);
    const versions = await allocBuffer(3 * 4); // directory version, key revision, minor revision
    const count = await allocBuffer(4);
    await GTIFDirectoryInfo(gtif, versions, count);
    const [version, revision, minor] = [await readNumberAt(versions, 0, 'int32'), await readNumberAt(versions, 1, 'int32'), await readNumberAt(versions, 2, 'int32')];
    console.log(`GeoTIFF ${version}, key revision ${revision}.${minor}, ${await readNumberAt(count, 0, 'int32')} keys`);
    const common = [geokey_t.GTModelTypeGeoKey, geokey_t.GTRasterTypeGeoKey, geokey_t.GTCitationGeoKey, geokey_t.GeographicTypeGeoKey, geokey_t.GeogCitationGeoKey,
        geokey_t.GeogAngularUnitsGeoKey, geokey_t.ProjectedCSTypeGeoKey, geokey_t.PCSCitationGeoKey, geokey_t.ProjLinearUnitsGeoKey, geokey_t.VerticalCSTypeGeoKey,
        geokey_t.VerticalUnitsGeoKey];
    const [size, type, short] = [await allocBuffer(4), await allocBuffer(4), await allocBuffer(2)];
    for (const key of common) {
        const values = await GTIFKeyInfo(gtif, key, size, type);
        if (values === 0) continue; // the file does not set it
        const name = await readCString(await GTIFKeyName(key));
        const typeCode = await readNumberAt(type, 0, 'int32');
        const typeName = await readCString(await GTIFTypeName(typeCode));
        if (typeCode === tagtype_t.TYPE_ASCII.value) {
            const text = await allocBuffer(values + 1);
            await GTIFKeyGetASCII(gtif, key, text, values + 1);
            console.log(`${name} (${typeName}): ${JSON.stringify(await readCString(text))}`);
        } else {
            await GTIFKeyGetSHORT(gtif, key, short, 0, 1);
            const value = await readNumberAt(short, 0, 'uint16');
            console.log(`${name} (${typeName}): ${value} = ${await GTIFValueNameEx(gtif, key, value)}`);
        }
    }

    // The tiepoint and the pixel scale are TIFF tags of doubles: TIFFGetField hands back their count and where they are.
    const tagCount = await allocBuffer(2);
    const tagValues = await allocPointer(1);
    const doubles = async (tag) => {
        if (!(await TIFFGetField(tif, tag, tagCount, tagValues))) return null;
        const at = await readPointerAt(tagValues, 0);
        const length = await readNumberAt(tagCount, 0, 'uint16');
        return Promise.all(Array.from({ length }, (_, i) => readNumberAt(at, i, 'float64')));
    };
    const [column, line, , x, y] = await doubles(TIFFTAG_GEOTIEPOINTS);
    const pixelScale = await doubles(TIFFTAG_GEOPIXELSCALE);
    console.log(`tiepoint: pixel ${column}, ${line} is at ${x}, ${y}; pixel scale: ${pixelScale[0]} x ${pixelScale[1]}`);
    await GTIFFree(gtif);
    await XTIFFClose(tif);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
