export const imports = {
    '@crossbind/port-zlib/zlib.h': [
        'z_stream',
        'deflateInit2',
        'deflateSetDictionary',
        'deflateBound',
        'deflate',
        'deflateEnd',
        'inflateInit2',
        'inflateSetDictionary',
        'inflate',
        'inflateEnd',
        'Z_OK',
        'Z_STREAM_END',
        'Z_DEFLATED',
        'Z_DEFAULT_STRATEGY',
        'Z_FINISH',
        'Z_NO_FLUSH',
        'allocBuffer',
        'writeBytes',
        'readBytes',
        'readCString',
    ],
};
export const note = 'The same calls as the C++ on a `z_stream`, which crosses with its fields: `next_in` and `next_out` take `allocBuffer` handles, kept while zlib uses them, and `avail_out` and `total_out` read back what zlib wrote. `deflateInit2` and `inflateInit2` are macros over `deflateInit2_` and `inflateInit2_`, and `Z_DEFLATED`, `Z_FINISH` and the other constants are macros too; imported by name, each binds, and over the worker a constant is read with `await` like any other value.';
export const expected = ['dictionary: 1195 B', '59 B message: 59 B alone, 11 B with the dictionary', 'true'];

export default async function example({ z_stream, deflateInit2, deflateSetDictionary, deflateBound, deflate, deflateEnd, inflateInit2, inflateSetDictionary, inflate, inflateEnd, Z_OK, Z_STREAM_END, Z_DEFLATED, Z_DEFAULT_STRATEGY, Z_FINISH, Z_NO_FLUSH, allocBuffer, writeBytes, readBytes, readCString }, console) {
    const event = (i) => `{"event":"click","user":${1000 + ((i * 37) % 900)},"page":"/products/${i % 12}","ms":${(i * 7919) % 400}}`;
    const dictionary = Array.from({ length: 20 }, (_, i) => event(i)).join('\n');
    const [ok, streamEnd] = [await Z_OK, await Z_STREAM_END];
    const bytes = async (text) => {
        const buffer = await allocBuffer(text.length);
        await writeBytes(buffer, text);
        return buffer;
    };
    const preset = await bytes(dictionary);

    const compress = async (message, primed) => {
        const stream = await new z_stream();
        // windowBits -15: raw deflate with a 32 KiB window.
        if ((await deflateInit2(stream, 9, await Z_DEFLATED, -15, 8, await Z_DEFAULT_STRATEGY)) !== ok) throw new Error('level must be between -1 and 9');
        try {
            if (primed) await deflateSetDictionary(stream, preset, dictionary.length);
            const capacity = await deflateBound(stream, message.length);
            const [input, output] = [await bytes(message), await allocBuffer(capacity)];
            stream.next_in = input;
            stream.avail_in = message.length;
            stream.next_out = output;
            stream.avail_out = capacity;
            if ((await deflate(stream, await Z_FINISH)) !== streamEnd) throw new Error('deflate did not finish');
            return await readBytes(output, await stream.total_out);
        } finally {
            await deflateEnd(stream);
        }
    };

    const decompress = async (packed, primed) => {
        const stream = await new z_stream();
        if ((await inflateInit2(stream, -15)) !== ok) throw new Error('inflateInit2 failed');
        try {
            // Raw deflate carries no dictionary ID, so the dictionary goes in before the first inflate().
            if (primed) await inflateSetDictionary(stream, preset, dictionary.length);
            const [input, chunk] = [await bytes(packed), await allocBuffer(16 << 10)];
            stream.next_in = input;
            stream.avail_in = packed.length;
            let message = '';
            for (let status = ok; status !== streamEnd; ) {
                stream.next_out = chunk;
                stream.avail_out = 16 << 10;
                status = await inflate(stream, await Z_NO_FLUSH);
                if (status !== ok && status !== streamEnd) {
                    const reason = await stream.msg;
                    throw new Error(reason ? await readCString(reason) : 'truncated or corrupt input');
                }
                message += await readBytes(chunk, (16 << 10) - (await stream.avail_out));
            }
            return message;
        } finally {
            await inflateEnd(stream);
        }
    };

    const message = event(4321);
    const alone = await compress(message, false);
    const packed = await compress(message, true);
    console.log(`dictionary: ${dictionary.length} B`);
    console.log(`${message.length} B message: ${alone.length} B alone, ${packed.length} B with the dictionary`);
    console.log((await decompress(packed, true)) === message);
}
