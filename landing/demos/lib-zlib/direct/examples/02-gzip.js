export const imports = {
    '@crossbind/port-zlib/zlib.h': [
        'z_stream',
        'gz_header',
        'deflateInit2',
        'deflateSetHeader',
        'deflateBound',
        'deflate',
        'deflateEnd',
        'inflateInit2',
        'inflateGetHeader',
        'inflate',
        'inflateEnd',
        'Z_OK',
        'Z_STREAM_END',
        'Z_DEFLATED',
        'Z_DEFAULT_STRATEGY',
        'Z_FINISH',
        'Z_BLOCK',
        'allocBuffer',
        'writeBytes',
        'readBytes',
        'readCString',
    ],
};
export const note = 'The same calls as the C++, macros and constants included: `z_stream` and `gz_header` cross with their fields, so JavaScript fills `name`, `time` and `os` for `deflateSetHeader`, and after `inflateGetHeader` reads `time`, `done` and the name zlib copied into the buffer `name` points at. A pointer field keeps only the address of the `allocBuffer` handle it is given, so the handles stay in variables while zlib works, and each buffer has one zero byte more to end a C string. One inflating stream reads the header with `Z_BLOCK` and then the data, where the C++ opens a second one.';
export const expected = ['3115 B -> 747 B, starts 1f 8b', 'readings.csv 2026-01-01T00:00:00.000Z', 'true'];

export default async function example({ z_stream, gz_header, deflateInit2, deflateSetHeader, deflateBound, deflate, deflateEnd, inflateInit2, inflateGetHeader, inflate, inflateEnd, Z_OK, Z_STREAM_END, Z_DEFLATED, Z_DEFAULT_STRATEGY, Z_FINISH, Z_BLOCK, allocBuffer, writeBytes, readBytes, readCString }, console) {
    const rows = Array.from({ length: 200 }, (_, i) => `${i + 1},sensor-${i % 4},${18 + ((i * 7) % 9)}`);
    const csv = ['reading,sensor,celsius', ...rows].join('\n') + '\n';
    const [ok, streamEnd] = [await Z_OK, await Z_STREAM_END];
    const bytes = async (text) => {
        const buffer = await allocBuffer(text.length + 1); // zero-filled, so the last byte ends a C string
        await writeBytes(buffer, text);
        return buffer;
    };

    const deflater = await new z_stream();
    // windowBits 15 + 16: a 32 KiB window, and the gzip wrapper instead of the zlib one.
    if ((await deflateInit2(deflater, 9, await Z_DEFLATED, 15 + 16, 8, await Z_DEFAULT_STRATEGY)) !== ok) throw new Error('level must be between -1 and 9');
    const header = await new gz_header();
    const name = await bytes('readings.csv');
    header.name = name;
    header.time = Date.UTC(2026, 0, 1) / 1000;
    header.os = 3; // Unix
    await deflateSetHeader(deflater, header);
    const capacity = await deflateBound(deflater, csv.length);
    const [input, output] = [await bytes(csv), await allocBuffer(capacity)];
    deflater.next_in = input;
    deflater.avail_in = csv.length;
    deflater.next_out = output;
    deflater.avail_out = capacity;
    const packedStatus = await deflate(deflater, await Z_FINISH);
    const gz = await readBytes(output, await deflater.total_out);
    await deflateEnd(deflater);
    if (packedStatus !== streamEnd) throw new Error('deflate did not finish');
    console.log(`${csv.length} B -> ${gz.length} B, starts ${gz.charCodeAt(0).toString(16)} ${gz.charCodeAt(1).toString(16)}`);

    const inflater = await new z_stream();
    if ((await inflateInit2(inflater, 15 + 16)) !== ok) throw new Error('inflateInit2 failed'); // + 16: gzip only
    const parsed = await new gz_header();
    const nameBuffer = await allocBuffer(1024);
    parsed.name = nameBuffer;
    parsed.name_max = 1023;
    await inflateGetHeader(inflater, parsed);
    const [packed, copy] = [await bytes(gz), await allocBuffer(csv.length)];
    inflater.next_in = packed;
    inflater.avail_in = gz.length;
    inflater.next_out = copy;
    inflater.avail_out = csv.length;
    // inflateGetHeader fills the fields while inflate reads the header; Z_BLOCK stops right after it.
    const headerStatus = await inflate(inflater, await Z_BLOCK);
    if ((headerStatus !== ok && headerStatus !== streamEnd) || (await parsed.done) !== 1) throw new Error('not a complete gzip header');
    console.log(await readCString(nameBuffer), new Date((await parsed.time) * 1000).toISOString());
    const dataStatus = await inflate(inflater, await Z_FINISH);
    const text = await readBytes(copy, await inflater.total_out);
    await inflateEnd(inflater);
    if (dataStatus !== streamEnd) throw new Error('truncated or corrupt input');
    console.log(text === csv);
}
