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
        'jpeg_calc_output_dimensions',
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
    ],
    '@crossbind/port-jpegturbo/jpeglib_crossbind.h': ['jpeg_throwing_error'],
    '@crossbind/port-jpegturbo/jmorecfg.h': ['TRUE'],
    '@crossbind/port-jpegturbo/turbojpeg.h': ['tj3Free'],
};
export const note = '`scale_num` and `scale_denom` are fields like the others, set between `jpeg_read_header` and `jpeg_calc_output_dimensions`, which fills `output_width` and `output_height` without decoding anything. The 1/8 decode reads its 10 rows of 52 bytes with `readBuffer`, so the full-size image is not built in JavaScript either. The file comes from the first example\'s encoder and stays in the module\'s memory.';
export const expected = ['1/1: 100x75', '1/2: 50x38', '1/4: 25x19', '1/8: 13x10', '520 B of RGBA instead of 30000 B'];

export default async function example({ jpeg_compress_struct, jpeg_decompress_struct, jpeg_error_mgr, jpeg_create_compress, jpeg_create_decompress, jpeg_mem_src, jpeg_mem_dest, J_COLOR_SPACE, jpeg_set_defaults, jpeg_set_quality, jpeg_start_compress, jpeg_write_scanlines, jpeg_finish_compress, jpeg_destroy_compress, jpeg_read_header, jpeg_calc_output_dimensions, jpeg_start_decompress, jpeg_read_scanlines, jpeg_finish_decompress, jpeg_destroy_decompress, allocBuffer, allocPointer, readPointerAt, readNumberAt, writePointerAt, writeBuffer, readBuffer, jpeg_throwing_error, TRUE, tj3Free }, console) {
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

    // The header is read first; scale_num / scale_denom then pick the inverse DCT every block runs.
    const open = async (denominator) => {
        const decoder = await decompressor(jpeg);
        await jpeg_read_header(decoder.cinfo, await TRUE);
        decoder.cinfo.scale_num = 1;
        decoder.cinfo.scale_denom = denominator;
        return decoder;
    };
    for (const denominator of [1, 2, 4, 8]) {
        const decoder = await open(denominator);
        await jpeg_calc_output_dimensions(decoder.cinfo);
        console.log(`1/${denominator}: ${await decoder.cinfo.output_width}x${await decoder.cinfo.output_height}`);
        await jpeg_destroy_decompress(decoder.cinfo);
    }

    const decoder = await open(8);
    decoder.cinfo.out_color_space = await J_COLOR_SPACE.JCS_EXT_RGBA;
    await jpeg_start_decompress(decoder.cinfo);
    const stride = (await decoder.cinfo.output_width) * 4;
    const thumbnail = new Uint8Array(stride * (await decoder.cinfo.output_height));
    const output = await allocBuffer(stride);
    await writePointerAt(rows, 0, output);
    for (let at = 0; at < thumbnail.length; at += stride) {
        await jpeg_read_scanlines(decoder.cinfo, rows, 1);
        thumbnail.set(await readBuffer(output, stride), at);
    }
    await jpeg_finish_decompress(decoder.cinfo);
    await jpeg_destroy_decompress(decoder.cinfo);
    await tj3Free(jpeg.data);
    console.log(`${thumbnail.length} B of RGBA instead of ${rgba.length} B`);
}
