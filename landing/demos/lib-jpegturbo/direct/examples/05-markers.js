export const imports = {
    '@crossbind/port-jpegturbo/jpeglib.h': [
        'jpeg_compress_struct',
        'jpeg_decompress_struct',
        'jpeg_error_mgr',
        'jpeg_create_compress',
        'jpeg_create_decompress',
        'jpeg_mem_src',
        'jpeg_mem_dest',
        'J_COLOR_SPACE',
        'jpeg_set_defaults',
        'jpeg_set_quality',
        'jpeg_start_compress',
        'jpeg_write_scanlines',
        'jpeg_finish_compress',
        'jpeg_destroy_compress',
        'JPEG_APP0',
        'JPEG_COM',
        'jpeg_save_markers',
        'jpeg_read_header',
        'jpeg_read_coefficients',
        'jpeg_copy_critical_parameters',
        'jpeg_write_coefficients',
        'jpeg_write_marker',
        'jpeg_finish_decompress',
        'jpeg_destroy_decompress',
        'allocBuffer',
        'allocPointer',
        'readPointerAt',
        'readNumberAt',
        'writePointerAt',
        'writeBuffer',
        'readBuffer',
    ],
    '@crossbind/port-jpegturbo/jpeglib_crossbind.h': ['jpeg_throwing_error'],
    '@crossbind/port-jpegturbo/jmorecfg.h': ['TRUE'],
    '@crossbind/port-jpegturbo/turbojpeg.h': ['tj3Free'],
};
export const note = 'The saved markers are walked as in the transcoding example, and each segment\'s bytes are copied out once with `readBuffer`: the labels, the EXIF orientation (read with a `DataView`) and the comment are worked out in JavaScript. New segments go the other way, a `Uint8Array` copied into an `allocBuffer` with `writeBuffer` and handed to `jpeg_write_marker`; `TextEncoder` and `TextDecoder` turn the comment into bytes and back.';
export const expected = ['APP0 JFIF 14 B, APP1 Exif 32 B, COM 19 B', 'orientation 6, comment "made with crossbind", 59 B added'];

export default async function example({ jpeg_compress_struct, jpeg_decompress_struct, jpeg_error_mgr, jpeg_create_compress, jpeg_create_decompress, jpeg_mem_src, jpeg_mem_dest, J_COLOR_SPACE, jpeg_set_defaults, jpeg_set_quality, jpeg_start_compress, jpeg_write_scanlines, jpeg_finish_compress, jpeg_destroy_compress, JPEG_APP0, JPEG_COM, jpeg_save_markers, jpeg_read_header, jpeg_read_coefficients, jpeg_copy_critical_parameters, jpeg_write_coefficients, jpeg_write_marker, jpeg_finish_decompress, jpeg_destroy_decompress, allocBuffer, allocPointer, readPointerAt, readNumberAt, writePointerAt, writeBuffer, readBuffer, jpeg_throwing_error, TRUE, tj3Free }, console) {
    const [width, height] = [100, 75];
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
        const [x, y] = [i % width, Math.floor(i / width)];
        const disc = (x - 50) ** 2 + (y - 37) ** 2 < 400;
        rgba.set(disc ? [230, 30, 40, 255] : [x * 2, y * 3, 160, 255], i * 4);
    }

    // The C++ Compressor and Decompressor: a libjpeg struct and the error manager it points at, which throws libjpeg's message.
    const compressor = async () => {
        const codec = { cinfo: await new jpeg_compress_struct(), jerr: await new jpeg_error_mgr() };
        codec.cinfo.err = await jpeg_throwing_error(codec.jerr);
        await jpeg_create_compress(codec.cinfo);
        return codec;
    };
    const decompressor = async ({ data, size }) => {
        const codec = { cinfo: await new jpeg_decompress_struct(), jerr: await new jpeg_error_mgr() };
        codec.cinfo.err = await jpeg_throwing_error(codec.jerr);
        await jpeg_create_decompress(codec.cinfo);
        await jpeg_mem_src(codec.cinfo, data, size);
        return codec;
    };
    // jpeg_mem_dest's output: the file libjpeg allocates, and its size.
    const memoryDestination = async (cinfo) => {
        const [data, size] = [await allocPointer(1), await allocBuffer(4)];
        await jpeg_mem_dest(cinfo, data, size);
        return async () => ({ data: await readPointerAt(data, 0), size: await readNumberAt(size, 0, 'uint32') });
    };
    const rows = await allocPointer(1); // a JSAMPARRAY of one row

    // The first example's encoder at quality 90 (jpeg_set_defaults samples 4:2:0); the file stays in the module's memory.
    const encoder = await compressor();
    const encoded = await memoryDestination(encoder.cinfo);
    encoder.cinfo.image_width = width;
    encoder.cinfo.image_height = height;
    encoder.cinfo.input_components = 4;
    encoder.cinfo.in_color_space = await J_COLOR_SPACE.JCS_EXT_RGBA;
    await jpeg_set_defaults(encoder.cinfo);
    await jpeg_set_quality(encoder.cinfo, 90, await TRUE);
    await jpeg_start_compress(encoder.cinfo, await TRUE);
    const input = await allocBuffer(width * 4);
    await writePointerAt(rows, 0, input);
    for (let y = 0; y < height; y += 1) {
        await writeBuffer(input, rgba.subarray(y * width * 4, (y + 1) * width * 4));
        await jpeg_write_scanlines(encoder.cinfo, rows, 1);
    }
    await jpeg_finish_compress(encoder.cinfo);
    await jpeg_destroy_compress(encoder.cinfo);
    const jpeg = await encoded();

    const [APP0, COM] = [await JPEG_APP0, await JPEG_COM];
    // Reads the header and keeps every APPn and COM segment: its code, where libjpeg holds it and a copy of its bytes.
    const open = async (file) => {
        const decoder = await decompressor(file);
        await jpeg_save_markers(decoder.cinfo, COM, 0xffff);
        for (let app = 0; app < 16; app += 1) await jpeg_save_markers(decoder.cinfo, APP0 + app, 0xffff);
        await jpeg_read_header(decoder.cinfo, await TRUE);
        const markers = [];
        for (let marker = await decoder.cinfo.marker_list; marker; marker = await marker.next) {
            const [code, data, length] = [await marker.marker, await marker.data, await marker.data_length];
            markers.push({ code, data, length, bytes: await readBuffer(data, length) });
        }
        return { ...decoder, markers };
    };
    const LABELS = [[0, 'JFIF\0', 'JFIF'], [1, 'Exif\0\0', 'Exif'], [1, 'http://ns.adobe.com/xap/1.0/\0', 'XMP'], [2, 'ICC_PROFILE\0', 'ICC profile'], [14, 'Adobe', 'Adobe']];
    const startsWith = (bytes, id) => bytes.length >= id.length && [...id].every((char, at) => bytes[at] === char.charCodeAt(0));
    const label = ({ code, bytes }) => (code === COM ? '' : (LABELS.find(([app, id]) => code === APP0 + app && startsWith(bytes, id))?.[2] ?? 'unknown'));
    const writeMarker = async (cinfo, code, bytes) => {
        const data = await allocBuffer(bytes.length);
        await writeBuffer(data, bytes);
        await jpeg_write_marker(cinfo, code, data, bytes.length);
    };

    // Sets the EXIF orientation and a comment without re-encoding: the coefficients are copied, and every other segment is kept.
    const tag = async (file, orientation, comment) => {
        const source = await open(file);
        const coefficients = await jpeg_read_coefficients(source.cinfo);
        const target = await compressor();
        const tagged = await memoryDestination(target.cinfo);
        await jpeg_copy_critical_parameters(source.cinfo, target.cinfo);
        await jpeg_write_coefficients(target.cinfo, coefficients);
        // "Exif\0\0", then a big-endian TIFF header and one IFD holding tag 0x0112 (Orientation, SHORT).
        const exif = Uint8Array.of(...new TextEncoder().encode('Exif\0\0MM'), 0, 42, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0);
        await writeMarker(target.cinfo, APP0 + 1, exif);
        const jfif = await target.cinfo.write_JFIF_header;
        for (const marker of source.markers) {
            if (marker.code === COM || label(marker) === 'Exif') continue; // replaced
            if (jfif && label(marker) === 'JFIF') continue; // written by the library
            await jpeg_write_marker(target.cinfo, marker.code, marker.data, marker.length);
        }
        await writeMarker(target.cinfo, COM, new TextEncoder().encode(comment));
        await jpeg_finish_compress(target.cinfo);
        await jpeg_finish_decompress(source.cinfo);
        await jpeg_destroy_compress(target.cinfo);
        await jpeg_destroy_decompress(source.cinfo);
        return tagged();
    };

    // Orientation from IFD0 of an EXIF segment, in either TIFF byte order; 0 when it is absent.
    const exifOrientation = (exif) => {
        const tiff = new DataView(exif.buffer, exif.byteOffset + 6, exif.length - 6);
        if (tiff.byteLength < 8) return 0;
        const little = tiff.getUint8(0) === 0x49; // "II"
        const ifd = tiff.getUint32(4, little);
        if (ifd + 2 > tiff.byteLength) return 0;
        for (let at = ifd + 2, end = at + tiff.getUint16(ifd, little) * 12; at < end && at + 12 <= tiff.byteLength; at += 12) {
            if (tiff.getUint16(at, little) === 0x0112) return tiff.getUint16(at + 8, little);
        }
        return 0;
    };
    // Every APPn and COM segment in file order (a COM has no label), the EXIF orientation and the first comment.
    const read = async (file) => {
        const decoder = await open(file);
        const exif = decoder.markers.find((marker) => label(marker) === 'Exif');
        const comment = decoder.markers.find((marker) => marker.code === COM);
        await jpeg_destroy_decompress(decoder.cinfo);
        return {
            markers: decoder.markers.map((marker) => ({ marker: marker.code === COM ? 'COM' : `APP${marker.code - APP0}`, label: label(marker), bytes: marker.length })),
            orientation: exif ? exifOrientation(exif.bytes) : 0,
            comment: comment ? new TextDecoder().decode(comment.bytes) : '',
        };
    };

    const tagged = await tag(jpeg, 6, 'made with crossbind');
    const info = await read(tagged);
    console.log(info.markers.map(({ marker, label, bytes }) => [marker, label, `${bytes} B`].filter(Boolean).join(' ')).join(', '));
    console.log(`orientation ${info.orientation}, comment "${info.comment}", ${tagged.size - jpeg.size} B added`);
    await Promise.all([jpeg, tagged].map(({ data }) => tj3Free(data)));
}
