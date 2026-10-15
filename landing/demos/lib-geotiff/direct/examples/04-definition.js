export const imports = {
    '@crossbind/port-geotiff/geotiff.h': ['GTIFNew', 'GTIFKeySet', 'GTIFWriteKeys', 'GTIFValueNameEx', 'GTIFFree', 'tagtype_t', 'allocBuffer', 'allocPointer', 'readBuffer', 'writeBuffer', 'readPointerAt', 'readCString', 'releaseCallback'],
    '@crossbind/port-geotiff/geo_normalize.h': [
        'GTIFAllocDefn',
        'GTIFGetDefn',
        'GTIFGetPCSInfo',
        'GTIFGetProjTRFInfo',
        'GTIFGetGCSInfo',
        'GTIFGetDatumInfo',
        'GTIFGetEllipsoidInfo',
        'GTIFGetPMInfo',
        'GTIFGetUOMLengthInfo',
        'GTIFGetProj4Defn',
        'GTIFFreeMemory',
        'GTIFFreeDefn',
    ],
    '@crossbind/port-geotiff/geokeys.h': ['geokey_t'],
    '@crossbind/port-geotiff/geovalues.h': ['modeltype_t', 'rastertype_t'],
    '@crossbind/port-geotiff/xtiffio.h': ['XTIFFClientOpen', 'XTIFFClose', 'TIFFTAG_GEOTIEPOINTS', 'TIFFTAG_GEOPIXELSCALE'],
    '@crossbind/port-tiff/tiffio.h': ['TIFFSetField', 'TIFFWriteScanline'],
    '@crossbind/port-tiff/tiff.h': ['TIFFTAG_IMAGEWIDTH', 'TIFFTAG_IMAGELENGTH', 'TIFFTAG_BITSPERSAMPLE', 'TIFFTAG_SAMPLESPERPIXEL', 'TIFFTAG_PHOTOMETRIC', 'TIFFTAG_ROWSPERSTRIP', 'PHOTOMETRIC_MINISBLACK'],
};
export const note = '`GTIFGetDefn` fills a `GTIFDefn` whose number fields JavaScript reads as the C++ does (`defn.PCS`, `defn.CTProjection`, `defn.SemiMajor`), and the same lookups name each code. The projection parameters are missing: they sit in the arrays `ProjParm` and `ProjParmId`, and crossbind binds no array field, so the five lines that name each parameter\'s GeoKey are left out. The file is written as in the first example.';
export const expected = [
    'ModelTypeProjected EPSG:27700 OSGB36 / British National Grid',
    'projection 19916 British National Grid, CT_TransverseMercator',
    'geographic 4277 OSGB36, datum 6277 Ordnance Survey of Great Britain 1936',
    'ellipsoid 7001 Airy 1830: 6377563.396 m, 6356256.909 m',
    'prime meridian 8901 Greenwich, unit 9001 metre (1 m)',
    '+proj=tmerc +lat_0=49.000000000 +lon_0=-2.000000000 +k=0.999601 +x_0=400000.000 +y_0=-100000.000 +a=6377563.396 +b=6356256.909 +units=m',
];
export const init = { useWorker: false };

export default async function example({ GTIFNew, GTIFKeySet, GTIFWriteKeys, GTIFValueNameEx, GTIFFree, tagtype_t, allocBuffer, allocPointer, readBuffer, writeBuffer, readPointerAt, readCString, releaseCallback, GTIFAllocDefn, GTIFGetDefn, GTIFGetPCSInfo, GTIFGetProjTRFInfo, GTIFGetGCSInfo, GTIFGetDatumInfo, GTIFGetEllipsoidInfo, GTIFGetPMInfo, GTIFGetUOMLengthInfo, GTIFGetProj4Defn, GTIFFreeMemory, GTIFFreeDefn, geokey_t, modeltype_t, rastertype_t, XTIFFClientOpen, XTIFFClose, TIFFTAG_GEOTIEPOINTS, TIFFTAG_GEOPIXELSCALE, TIFFSetField, TIFFWriteScanline, TIFFTAG_IMAGEWIDTH, TIFFTAG_IMAGELENGTH, TIFFTAG_BITSPERSAMPLE, TIFFTAG_SAMPLESPERPIXEL, TIFFTAG_PHOTOMETRIC, TIFFTAG_ROWSPERSTRIP, PHOTOMETRIC_MINISBLACK }, console) {
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

    // A file that only says ProjectedCSTypeGeoKey = 27700, written as in the first example
    const [epsg, width, height, x, y, pixelSize] = [27700, 100, 100, 529000, 181000, 10];
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

    // GTIFGetDefn expands the one code through PROJ's database; the GTIFGet...Info lookups name each part.
    tif = await open('input.tif', 'r');
    gtif = await GTIFNew(tif);
    const defn = await GTIFAllocDefn();
    if (!gtif || !(await GTIFGetDefn(gtif, defn))) throw new Error('no coordinate system in the GeoKeys');
    const name = await allocPointer(1);
    const taken = async () => {
        const text = await readPointerAt(name, 0); // a C string the caller frees
        const value = text ? await readCString(text) : '';
        await GTIFFreeMemory(text);
        return value;
    };
    await GTIFGetPCSInfo(await defn.PCS, name, null, null, null);
    console.log(`${await GTIFValueNameEx(gtif, geokey_t.GTModelTypeGeoKey, await defn.Model)} EPSG:${await defn.PCS} ${await taken()}`);
    await GTIFGetProjTRFInfo(await defn.ProjCode, name, null, null);
    console.log(`projection ${await defn.ProjCode} ${await taken()}, ${await GTIFValueNameEx(gtif, geokey_t.ProjCoordTransGeoKey, await defn.CTProjection)}`);
    await GTIFGetGCSInfo(await defn.GCS, name, null, null, null);
    const geographic = await taken();
    await GTIFGetDatumInfo(await defn.Datum, name, null);
    console.log(`geographic ${await defn.GCS} ${geographic}, datum ${await defn.Datum} ${await taken()}`);
    await GTIFGetEllipsoidInfo(await defn.Ellipsoid, name, null, null);
    console.log(`ellipsoid ${await defn.Ellipsoid} ${await taken()}: ${(await defn.SemiMajor).toFixed(3)} m, ${(await defn.SemiMinor).toFixed(3)} m`);
    await GTIFGetPMInfo(await defn.PM, name, null);
    const primeMeridian = await taken();
    await GTIFGetUOMLengthInfo(await defn.UOMLength, name, null);
    console.log(`prime meridian ${await defn.PM} ${primeMeridian}, unit ${await defn.UOMLength} ${await taken()} (${await defn.UOMLengthInMeters} m)`);
    const proj = await GTIFGetProj4Defn(defn);
    console.log((await readCString(proj)).trim());
    await GTIFFreeMemory(proj);
    await GTIFFreeDefn(defn);
    await GTIFFree(gtif);
    await XTIFFClose(tif);
    for (const proc of [read, write, seek, close, fileSize]) await releaseCallback(proc);
}
