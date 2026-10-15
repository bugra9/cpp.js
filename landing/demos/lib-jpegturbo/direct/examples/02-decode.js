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
        'jpeg_read_header',
        'jpeg_has_multiple_scans',
        'jpeg_start_decompress',
        'jpeg_read_scanlines',
        'jpeg_finish_decompress',
        'jpeg_destroy_decompress',
        'allocBuffer',
        'allocPointer',
        'readPointerAt',
        'readNumberAt',
        'writePointerAt',
        'writeBuffer',
        'readBuffer',
        'writeBytes',
    ],
    '@crossbind/port-jpegturbo/jpeglib_crossbind.h': ['jpeg_throwing_error'],
    '@crossbind/port-jpegturbo/jmorecfg.h': ['TRUE'],
    '@crossbind/port-jpegturbo/turbojpeg.h': ['tj3Free'],
};
export const note = 'The first example\'s encoder leaves the file in the module\'s memory, where `jpeg_mem_src` reads it, and one decompress struct answers the header questions and then decodes, where the C++ opens two. Each struct is paired with its error manager, as in the C++ `Decompressor`. `jpeg_color_space` reads as its `J_COLOR_SPACE` number, so the names come from a list in that order, and each decoded row comes out with `readBuffer`. The bad file fails in `jpeg_read_header`: the error manager from `jpeglib_crossbind.h` throws libjpeg\'s message as a `std::runtime_error`, so the line is the C++ one, and the struct is destroyed after it all the same.';
export const expected = [
    '100x75, 3 components, YCbCr, baseline',
    '30000 B of RGBA; pixel (10, 10) was 20,30,160,255 and decodes as 22,29,159,255',
    'std::runtime_error: Not a JPEG file: starts with 0x63 0x72',
];

export default async function example({ jpeg_compress_struct, jpeg_decompress_struct, jpeg_error_mgr, jpeg_create_compress, jpeg_create_decompress, jpeg_mem_src, jpeg_mem_dest, J_COLOR_SPACE, jpeg_set_defaults, jpeg_set_quality, jpeg_start_compress, jpeg_write_scanlines, jpeg_finish_compress, jpeg_destroy_compress, jpeg_read_header, jpeg_has_multiple_scans, jpeg_start_decompress, jpeg_read_scanlines, jpeg_finish_decompress, jpeg_destroy_decompress, allocBuffer, allocPointer, readPointerAt, readNumberAt, writePointerAt, writeBuffer, readBuffer, writeBytes, jpeg_throwing_error, TRUE, tj3Free }, console) {
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

    const decoder = await decompressor(jpeg);
    await jpeg_read_header(decoder.cinfo, await TRUE);
    const colorSpaces = ['unknown', 'greyscale', 'RGB', 'YCbCr', 'CMYK', 'YCCK']; // J_COLOR_SPACE's first six, in order
    const colorSpace = colorSpaces[await decoder.cinfo.jpeg_color_space] ?? 'unknown';
    const progressive = await jpeg_has_multiple_scans(decoder.cinfo);
    console.log(`${await decoder.cinfo.image_width}x${await decoder.cinfo.image_height}, ${await decoder.cinfo.num_components} components, ${colorSpace}, ${progressive ? 'progressive' : 'baseline'}`);
    decoder.cinfo.out_color_space = await J_COLOR_SPACE.JCS_EXT_RGBA;
    await jpeg_start_decompress(decoder.cinfo);
    const stride = (await decoder.cinfo.output_width) * 4;
    const decoded = new Uint8Array(stride * (await decoder.cinfo.output_height));
    const output = await allocBuffer(stride);
    await writePointerAt(rows, 0, output);
    for (let at = 0; at < decoded.length; at += stride) {
        await jpeg_read_scanlines(decoder.cinfo, rows, 1);
        decoded.set(await readBuffer(output, stride), at);
    }
    await jpeg_finish_decompress(decoder.cinfo);
    await jpeg_destroy_decompress(decoder.cinfo);
    await tj3Free(jpeg.data);
    const at = (10 * width + 10) * 4;
    console.log(`${decoded.length} B of RGBA; pixel (10, 10) was ${rgba.slice(at, at + 4)} and decodes as ${decoded.slice(at, at + 4)}`);

    const text = await allocBuffer(9);
    await writeBytes(text, 'crossbind');
    const broken = await decompressor({ data: text, size: 9 });
    try {
        await jpeg_read_header(broken.cinfo, await TRUE);
    } catch (error) {
        console.log(error.message);
    } finally {
        await jpeg_destroy_decompress(broken.cinfo);
    }
}
