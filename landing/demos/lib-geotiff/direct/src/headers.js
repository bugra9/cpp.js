// Every name the examples import, from the header the site says it comes from. The build fails on a
// name that header does not export, so the import lines on the page are checked here.
export {
    GTIFDirectoryInfo,
    GTIFFree,
    GTIFImageToPCS,
    GTIFKeyGetASCII,
    GTIFKeyGetSHORT,
    GTIFKeyInfo,
    GTIFKeyName,
    GTIFKeySet,
    GTIFNew,
    GTIFPCSToImage,
    GTIFPrint,
    GTIFTypeName,
    GTIFValueNameEx,
    GTIFWriteKeys,
    LIBGEOTIFF_STRING_VERSION,
    allocBuffer,
    allocPointer,
    readBuffer,
    readCString,
    readNumberAt,
    readPointerAt,
    releaseCallback,
    tagtype_t,
    writeBuffer,
    writeNumberAt,
} from '@crossbind/port-geotiff/geotiff.h';
export {
    GTIFAllocDefn,
    GTIFFreeDefn,
    GTIFFreeMemory,
    GTIFGetDatumInfo,
    GTIFGetDefn,
    GTIFGetEllipsoidInfo,
    GTIFGetGCSInfo,
    GTIFGetPCSInfo,
    GTIFGetPMInfo,
    GTIFGetProj4Defn,
    GTIFGetProjTRFInfo,
    GTIFGetUOMLengthInfo,
    GTIFProj4FromLatLong,
    GTIFProj4ToLatLong,
} from '@crossbind/port-geotiff/geo_normalize.h';
export { geokey_t } from '@crossbind/port-geotiff/geokeys.h';
export { geographic_t, geounits_t, modeltype_t, rastertype_t } from '@crossbind/port-geotiff/geovalues.h';
export { TIFFTAG_GEOPIXELSCALE, TIFFTAG_GEOTIEPOINTS, XTIFFClientOpen, XTIFFClose } from '@crossbind/port-geotiff/xtiffio.h';
export { TIFFGetField, TIFFSetField, TIFFWriteScanline } from '@crossbind/port-tiff/tiffio.h';
export {
    COMPRESSION_ADOBE_DEFLATE,
    PHOTOMETRIC_MINISBLACK,
    PREDICTOR_HORIZONTAL,
    TIFFTAG_BITSPERSAMPLE,
    TIFFTAG_COMPRESSION,
    TIFFTAG_IMAGELENGTH,
    TIFFTAG_IMAGEWIDTH,
    TIFFTAG_PHOTOMETRIC,
    TIFFTAG_PREDICTOR,
    TIFFTAG_ROWSPERSTRIP,
    TIFFTAG_SAMPLESPERPIXEL,
} from '@crossbind/port-tiff/tiff.h';
