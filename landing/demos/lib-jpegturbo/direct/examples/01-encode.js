export const imports = {
    '@crossbind/port-jpegturbo/jpeglib.h': [
        'jpeg_compress_struct',
        'jpeg_error_mgr',
        'jpeg_create_compress',
        'jpeg_mem_dest',
        'J_COLOR_SPACE',
        'jpeg_set_defaults',
        'jpeg_set_quality',
        'jpeg_start_compress',
        'jpeg_write_scanlines',
        'jpeg_finish_compress',
        'jpeg_destroy_compress',
        'allocBuffer',
        'allocPointer',
        'writePointerAt',
        'writeBuffer',
        'readNumberAt',
        'readPointerAt',
    ],
    '@crossbind/port-jpegturbo/jpeglib_crossbind.h': ['jpeg_throwing_error'],
    '@crossbind/port-jpegturbo/jconfig.h': ['LIBJPEG_TURBO_VERSION_NUMBER'],
    '@crossbind/port-jpegturbo/jmorecfg.h': ['TRUE'],
    '@crossbind/port-jpegturbo/turbojpeg.h': ['tj3Free'],
};
export const note = 'The same calls on `jpeglib.h`; what the C++ class did for you is now yours. The structs come from `new`, `jpeg_create_compress` is libjpeg\'s macro, bound by name, and `jpeg_throwing_error` from the port\'s `jpeglib_crossbind.h` makes the error manager throw libjpeg\'s message instead of ending the program; `err` keeps only its address, so `jerr` stays in a variable until the struct is destroyed. `comp_info` reads as the first `jpeg_component_info`, the luma one. Rows go in through an `allocBuffer` that a one-entry `allocPointer` array points at, and `jpeg_mem_dest` hands the file back through an `unsigned char **` slot and a 4-byte `unsigned long`; `jpeglib.h` declares no `free`, so `tj3Free` from `turbojpeg.h` frees it. `LIBJPEG_TURBO_VERSION_NUMBER` and `TRUE` are macros, imported from `jconfig.h` and `jmorecfg.h`, the headers that define them, and read with `await` over the worker.';
export const expected = ({ jpegturbo }) => [
    `libjpeg-turbo ${jpegturbo}: 100x75, 30000 B of RGBA`,
    'quality 90, subsampling 444: 2791 B',
    'quality 90, subsampling 420: 1932 B',
    'quality 50, subsampling 420: 1171 B',
];

export default async function example({ jpeg_compress_struct, jpeg_error_mgr, jpeg_create_compress, jpeg_mem_dest, J_COLOR_SPACE, jpeg_set_defaults, jpeg_set_quality, jpeg_start_compress, jpeg_write_scanlines, jpeg_finish_compress, jpeg_destroy_compress, allocBuffer, allocPointer, writePointerAt, writeBuffer, readNumberAt, readPointerAt, jpeg_throwing_error, LIBJPEG_TURBO_VERSION_NUMBER, TRUE, tj3Free }, console) {
    const [width, height] = [100, 75];
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i += 1) {
        const [x, y] = [i % width, Math.floor(i / width)];
        const disc = (x - 50) ** 2 + (y - 37) ** 2 < 400;
        rgba.set(disc ? [230, 30, 40, 255] : [x * 2, y * 3, 160, 255], i * 4);
    }
    const version = await LIBJPEG_TURBO_VERSION_NUMBER;
    console.log(`libjpeg-turbo ${Math.floor(version / 1e6)}.${Math.floor(version / 1e3) % 1e3}.${version % 1e3}: ${width}x${height}, ${rgba.length} B of RGBA`);

    const row = await allocBuffer(width * 4);
    const rows = await allocPointer(1); // a JSAMPARRAY of one row
    await writePointerAt(rows, 0, row);
    for (const [quality, subsampling] of [[90, 444], [90, 420], [50, 420]]) {
        const cinfo = await new jpeg_compress_struct();
        const jerr = await new jpeg_error_mgr();
        cinfo.err = await jpeg_throwing_error(jerr);
        await jpeg_create_compress(cinfo);
        const file = await allocPointer(1);
        const size = await allocBuffer(4);
        await jpeg_mem_dest(cinfo, file, size);
        cinfo.image_width = width;
        cinfo.image_height = height;
        cinfo.input_components = 4;
        cinfo.in_color_space = await J_COLOR_SPACE.JCS_EXT_RGBA;
        await jpeg_set_defaults(cinfo);
        await jpeg_set_quality(cinfo, quality, await TRUE);
        const luma = await cinfo.comp_info;
        luma.h_samp_factor = subsampling === 444 ? 1 : 2;
        luma.v_samp_factor = subsampling === 420 ? 2 : 1;
        await jpeg_start_compress(cinfo, await TRUE);
        for (let y = 0; y < height; y += 1) {
            await writeBuffer(row, rgba.subarray(y * width * 4, (y + 1) * width * 4));
            await jpeg_write_scanlines(cinfo, rows, 1);
        }
        await jpeg_finish_compress(cinfo);
        console.log(`quality ${quality}, subsampling ${subsampling}: ${await readNumberAt(size, 0, 'uint32')} B`);
        await tj3Free(await readPointerAt(file, 0));
        await jpeg_destroy_compress(cinfo);
    }
}
