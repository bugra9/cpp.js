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
        'jpeg_simple_progression',
        'jpeg_write_coefficients',
        'jpeg_write_marker',
        'jpeg_finish_decompress',
        'jpeg_destroy_decompress',
        'jpeg_start_decompress',
        'jpeg_read_scanlines',
        'allocBuffer',
        'allocPointer',
        'readPointerAt',
        'readNumberAt',
        'writePointerAt',
        'writeBuffer',
        'readBytes',
    ],
    '@crossbind/port-jpegturbo/jpeglib_crossbind.h': ['jpeg_throwing_error'],
    '@crossbind/port-jpegturbo/jmorecfg.h': ['TRUE'],
    '@crossbind/port-jpegturbo/turbojpeg.h': ['tj3Free'],
};
export const note = '`jpeg_read_coefficients` returns the coefficient arrays as a handle that goes straight to `jpeg_write_coefficients`. The saved segments are a linked list of `jpeg_marker_struct` instances, `marker_list` and then each `next` until `null`, and `data` is a handle that `jpeg_write_marker` takes as it is; only five bytes of each cross, to recognise a JFIF or Adobe segment. `optimize_coding` is a `boolean` field and takes the JavaScript boolean as it is, and `JPEG_APP0` and `JPEG_COM` are macros, bound when imported by name and read with `await` over the worker. The three decodes are compared as byte strings from `readBytes`.';
export const expected = ['baseline 1932 B, optimized 1512 B, progressive 1773 B', 'true'];

export default async function example({ jpeg_compress_struct, jpeg_decompress_struct, jpeg_error_mgr, jpeg_create_compress, jpeg_create_decompress, jpeg_mem_src, jpeg_mem_dest, J_COLOR_SPACE, jpeg_set_defaults, jpeg_set_quality, jpeg_start_compress, jpeg_write_scanlines, jpeg_finish_compress, jpeg_destroy_compress, JPEG_APP0, JPEG_COM, jpeg_save_markers, jpeg_read_header, jpeg_read_coefficients, jpeg_copy_critical_parameters, jpeg_simple_progression, jpeg_write_coefficients, jpeg_write_marker, jpeg_finish_decompress, jpeg_destroy_decompress, jpeg_start_decompress, jpeg_read_scanlines, allocBuffer, allocPointer, readPointerAt, readNumberAt, writePointerAt, writeBuffer, readBytes, jpeg_throwing_error, TRUE, tj3Free }, console) {
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
    // As `jpegtran -copy all`: the coefficients and every APPn and COM segment go to a new file, only the Huffman coding changes.
    const transcode = async (file, optimize, progressive) => {
        const source = await decompressor(file);
        await jpeg_save_markers(source.cinfo, COM, 0xffff);
        for (let app = 0; app < 16; app += 1) await jpeg_save_markers(source.cinfo, APP0 + app, 0xffff);
        await jpeg_read_header(source.cinfo, await TRUE);
        const coefficients = await jpeg_read_coefficients(source.cinfo);

        const target = await compressor();
        const transcoded = await memoryDestination(target.cinfo);
        await jpeg_copy_critical_parameters(source.cinfo, target.cinfo);
        target.cinfo.optimize_coding = optimize;
        if (progressive) await jpeg_simple_progression(target.cinfo);
        await jpeg_write_coefficients(target.cinfo, coefficients);
        const [jfif, adobe] = [await target.cinfo.write_JFIF_header, await target.cinfo.write_Adobe_marker];
        for (let marker = await source.cinfo.marker_list; marker; marker = await marker.next) {
            const [code, data, length] = [await marker.marker, await marker.data, await marker.data_length];
            const head = await readBytes(data, Math.min(length, 5));
            // The library writes its own JFIF and Adobe segments; copying the old ones would duplicate them.
            if ((jfif && code === APP0 && head === 'JFIF\0') || (adobe && code === APP0 + 14 && head === 'Adobe')) continue;
            await jpeg_write_marker(target.cinfo, code, data, length);
        }
        await jpeg_finish_compress(target.cinfo);
        await jpeg_finish_decompress(source.cinfo);
        await jpeg_destroy_compress(target.cinfo);
        await jpeg_destroy_decompress(source.cinfo);
        return transcoded();
    };
    const optimized = await transcode(jpeg, true, false);
    const progressive = await transcode(jpeg, false, true);
    console.log(`baseline ${jpeg.size} B, optimized ${optimized.size} B, progressive ${progressive.size} B`);

    // The second example's decoder: RGBA, one byte per character.
    const decode = async (file) => {
        const decoder = await decompressor(file);
        await jpeg_read_header(decoder.cinfo, await TRUE);
        decoder.cinfo.out_color_space = await J_COLOR_SPACE.JCS_EXT_RGBA;
        await jpeg_start_decompress(decoder.cinfo);
        const [stride, lines] = [(await decoder.cinfo.output_width) * 4, await decoder.cinfo.output_height];
        const output = await allocBuffer(stride);
        await writePointerAt(rows, 0, output);
        let pixels = '';
        for (let y = 0; y < lines; y += 1) {
            await jpeg_read_scanlines(decoder.cinfo, rows, 1);
            pixels += await readBytes(output, stride);
        }
        await jpeg_finish_decompress(decoder.cinfo);
        await jpeg_destroy_decompress(decoder.cinfo);
        return pixels;
    };
    const pixels = await decode(jpeg);
    console.log((await decode(optimized)) === pixels && (await decode(progressive)) === pixels);
    await Promise.all([jpeg, optimized, progressive].map(({ data }) => tj3Free(data)));
}
