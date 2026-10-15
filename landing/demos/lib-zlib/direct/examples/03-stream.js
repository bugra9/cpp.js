export const imports = {
    '@crossbind/port-zlib/zlib.h': [
        'z_stream',
        'deflateInit2',
        'deflate',
        'deflateEnd',
        'inflateInit2',
        'inflate',
        'inflateReset',
        'inflateEnd',
        'Z_OK',
        'Z_STREAM_END',
        'Z_DEFLATED',
        'Z_DEFAULT_STRATEGY',
        'Z_NO_FLUSH',
        'Z_FINISH',
        'Z_NEED_DICT',
        'Z_DATA_ERROR',
        'Z_MEM_ERROR',
        'allocBuffer',
        'writeBytes',
        'readBytes',
        'readCString',
    ],
};
export const note = 'The same `deflate()` and `inflate()` loops on a `z_stream`, whose fields cross: `next_in` and `next_out` take `allocBuffer` handles and `avail_in` and `avail_out` count down as zlib reads and writes. `fread` and `fwrite` are not in `zlib.h`, so the log stays a JavaScript string: each step copies the next 64 KB slice into the input buffer and reads what zlib wrote out of the output buffer.';
export const expected = ['2537578 B -> 363636 B -> 2537578 B', 'true'];

export default async function example({ z_stream, deflateInit2, deflate, deflateEnd, inflateInit2, inflate, inflateReset, inflateEnd, Z_OK, Z_STREAM_END, Z_DEFLATED, Z_DEFAULT_STRATEGY, Z_NO_FLUSH, Z_FINISH, Z_NEED_DICT, Z_DATA_ERROR, Z_MEM_ERROR, allocBuffer, writeBytes, readBytes, readCString }, console) {
    let seed = 42;
    const random = (n) => (seed = (seed * 48271) % 2147483647) % n;
    const lines = Array.from({ length: 50000 }, (_, i) => `2026-09-24T12:00:${String(i % 60).padStart(2, '0')}Z GET /api/items/${random(9000)} ${random(10) ? 200 : 404} ${random(900)}ms`);
    const log = lines.join('\n');
    const CHUNK = 64 << 10;
    const [source, target] = [await allocBuffer(CHUNK), await allocBuffer(CHUNK)];
    const [ok, streamEnd, noFlush, finish] = [await Z_OK, await Z_STREAM_END, await Z_NO_FLUSH, await Z_FINISH];

    const deflater = await new z_stream();
    if ((await deflateInit2(deflater, 6, await Z_DEFLATED, 15 + 16, 8, await Z_DEFAULT_STRATEGY)) !== ok) throw new Error('level must be between -1 and 9');
    let packed = '';
    for (let offset = 0, flush = noFlush; flush !== finish; offset += CHUNK) {
        const slice = log.slice(offset, offset + CHUNK);
        flush = slice.length < CHUNK ? finish : noFlush;
        await writeBytes(source, slice);
        deflater.avail_in = slice.length;
        deflater.next_in = source;
        let room = 0;
        do {
            deflater.avail_out = CHUNK;
            deflater.next_out = target;
            await deflate(deflater, flush);
            room = await deflater.avail_out;
            packed += await readBytes(target, CHUNK - room);
        } while (room === 0);
    }
    await deflateEnd(deflater);

    // + 32: gzip or zlib, from the header. Every member of a concatenated .gz is read, as gunzip does.
    const inflater = await new z_stream();
    if ((await inflateInit2(inflater, 15 + 32)) !== ok) throw new Error('inflateInit2 failed');
    const fatal = [await Z_NEED_DICT, await Z_DATA_ERROR, await Z_MEM_ERROR];
    let copy = '';
    let status = ok;
    for (let offset = 0; offset < packed.length; offset += CHUNK) {
        const slice = packed.slice(offset, offset + CHUNK);
        await writeBytes(source, slice);
        inflater.avail_in = slice.length;
        inflater.next_in = source;
        let room = 0;
        do {
            if (status === streamEnd) {
                if ((await inflater.avail_in) === 0) break;
                await inflateReset(inflater); // another member follows
            }
            inflater.avail_out = CHUNK;
            inflater.next_out = target;
            status = await inflate(inflater, noFlush);
            if (fatal.includes(status)) {
                const reason = await inflater.msg;
                throw new Error(reason ? await readCString(reason) : 'corrupt input');
            }
            room = await inflater.avail_out;
            copy += await readBytes(target, CHUNK - room);
        } while (room === 0 || (status === streamEnd && (await inflater.avail_in) > 0));
    }
    await inflateEnd(inflater);
    if (status !== streamEnd) throw new Error('the input ends in the middle of a gzip member');
    console.log(`${log.length} B -> ${packed.length} B -> ${copy.length} B`);
    console.log(copy === log);
}
