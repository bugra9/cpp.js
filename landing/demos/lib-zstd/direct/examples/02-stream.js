export const imports = {
    '@crossbind/port-zstd/zstd.h': [
        'ZSTD_createCCtx',
        'ZSTD_freeCCtx',
        'ZSTD_CCtx_setParameter',
        'ZSTD_cParameter',
        'ZSTD_CStreamInSize',
        'ZSTD_CStreamOutSize',
        'ZSTD_compressStream2',
        'ZSTD_EndDirective',
        'ZSTD_createDCtx',
        'ZSTD_freeDCtx',
        'ZSTD_DStreamInSize',
        'ZSTD_DStreamOutSize',
        'ZSTD_decompressStream',
        'ZSTD_inBuffer',
        'ZSTD_outBuffer',
        'ZSTD_isError',
        'ZSTD_getErrorName',
        'allocBuffer',
        'writeBytes',
        'readBytes',
    ],
};
export const note = 'The same two loops on `ZSTD_compressStream2` and `ZSTD_decompressStream`. `ZSTD_inBuffer` and `ZSTD_outBuffer` cross with their fields: `src` and `dst` take `allocBuffer` handles, kept while zstd uses them, and zstd moves `pos` as it reads and writes. `fread` and `fwrite` are not in `zstd.h`, so the log stays a JavaScript string: each step copies the next 128 KB slice into the input buffer and reads `pos` bytes back out of the output buffer.';
export const expected = ['2537578 B -> 378699 B -> 2537578 B', 'true'];

export default async function example({ ZSTD_createCCtx, ZSTD_freeCCtx, ZSTD_CCtx_setParameter, ZSTD_cParameter, ZSTD_CStreamInSize, ZSTD_CStreamOutSize, ZSTD_compressStream2, ZSTD_EndDirective, ZSTD_createDCtx, ZSTD_freeDCtx, ZSTD_DStreamInSize, ZSTD_DStreamOutSize, ZSTD_decompressStream, ZSTD_inBuffer, ZSTD_outBuffer, ZSTD_isError, ZSTD_getErrorName, allocBuffer, writeBytes, readBytes }, console) {
    let seed = 42;
    const random = (n) => (seed = (seed * 48271) % 2147483647) % n;
    const lines = Array.from({ length: 50000 }, (_, i) => `2026-09-24T12:00:${String(i % 60).padStart(2, '0')}Z GET /api/items/${random(9000)} ${random(10) ? 200 : 404} ${random(900)}ms`);
    const log = lines.join('\n');
    const check = async (code) => {
        if (await ZSTD_isError(code)) throw new Error(await ZSTD_getErrorName(code));
        return code;
    };
    const buffers = async (inSize, outSize) => {
        const [input, output] = [await allocBuffer(inSize), await allocBuffer(outSize)];
        const [source, target] = [await new ZSTD_inBuffer(), await new ZSTD_outBuffer()];
        source.src = input;
        target.dst = output;
        target.size = outSize;
        return { input, output, source, target };
    };

    const cctx = await ZSTD_createCCtx();
    await check(await ZSTD_CCtx_setParameter(cctx, await ZSTD_cParameter.ZSTD_c_compressionLevel, 3));
    await check(await ZSTD_CCtx_setParameter(cctx, await ZSTD_cParameter.ZSTD_c_checksumFlag, 1));
    const [keepGoing, endFrame] = [await ZSTD_EndDirective.ZSTD_e_continue, await ZSTD_EndDirective.ZSTD_e_end];
    const inSize = await ZSTD_CStreamInSize();
    const packing = await buffers(inSize, await ZSTD_CStreamOutSize());
    let packed = '';
    for (let offset = 0, last = false; !last; offset += inSize) {
        const slice = log.slice(offset, offset + inSize);
        last = slice.length < inSize;
        await writeBytes(packing.input, slice);
        packing.source.size = slice.length;
        packing.source.pos = 0;
        let finished = false;
        while (!finished) {
            packing.target.pos = 0;
            const remaining = await check(await ZSTD_compressStream2(cctx, packing.target, packing.source, last ? endFrame : keepGoing));
            packed += await readBytes(packing.output, await packing.target.pos);
            finished = last ? remaining === 0 : (await packing.source.pos) === slice.length;
        }
    }
    await ZSTD_freeCCtx(cctx);

    const dctx = await ZSTD_createDCtx();
    const chunk = await ZSTD_DStreamInSize();
    const unpacking = await buffers(chunk, await ZSTD_DStreamOutSize());
    let copy = '';
    let pending = 0;
    for (let offset = 0; offset < packed.length; offset += chunk) {
        const slice = packed.slice(offset, offset + chunk);
        await writeBytes(unpacking.input, slice);
        unpacking.source.size = slice.length;
        unpacking.source.pos = 0;
        while ((await unpacking.source.pos) < slice.length) {
            unpacking.target.pos = 0;
            pending = await check(await ZSTD_decompressStream(dctx, unpacking.target, unpacking.source));
            copy += await readBytes(unpacking.output, await unpacking.target.pos);
        }
    }
    await ZSTD_freeDCtx(dctx);
    if (pending !== 0) throw new Error('the input ends in the middle of a zstd frame');
    console.log(`${log.length} B -> ${packed.length} B -> ${copy.length} B`);
    console.log(copy === log);
}
