// Every name the examples import, from the header the site says it comes from. The build fails on a
// name that header does not export, so the import lines on the page are checked here.
export {
    WebPConfig,
    WebPConfigInit,
    WebPConfigPreset,
    WebPEncode,
    WebPEncodeLosslessRGBA,
    WebPEncodeRGBA,
    WebPGetEncoderVersion,
    WebPPicture,
    WebPPictureFree,
    WebPPictureImportRGBA,
    WebPPictureInit,
    WebPPlaneDistortion,
    WebPPreset,
    WebPValidateConfig,
    allocBuffer,
    allocPointer,
    readBytes,
    readNumberAt,
    readPointerAt,
    releaseCallback,
    writeBytes,
} from '@crossbind/port-webp/webp/encode.h';
export { VP8StatusCode, WebPBitstreamFeatures, WebPDecodeRGBA, WebPGetFeatures, WebPGetInfo } from '@crossbind/port-webp/webp/decode.h';
export { WebPFree } from '@crossbind/port-webp/webp/types.h';
