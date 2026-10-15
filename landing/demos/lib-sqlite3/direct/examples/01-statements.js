export const imports = {
    '@crossbind/port-sqlite3/sqlite3.h': [
        'sqlite3_libversion',
        'sqlite3_open',
        'sqlite3_close',
        'sqlite3_exec',
        'sqlite3_prepare_v2',
        'sqlite3_bind_text',
        'sqlite3_step',
        'sqlite3_column_int',
        'sqlite3_column_text',
        'sqlite3_finalize',
        'sqlite3_errmsg',
        'SQLITE_OK',
        'SQLITE_ROW',
        'allocPointer',
        'readPointerAt',
        'writeNumberAt',
        'readCString',
    ],
};
export const note = 'The same calls on `sqlite3.h` as SQLite ships it. The result codes are imported by name and read once with `await`; `SQLITE_TRANSIENT`, `((sqlite3_destructor_type)-1)`, is a macro whose value is a pointer, so it has no binding and is read from a slot holding -1. `null` (`SQLITE_STATIC`) is no stand-in: the binding frees its copy of a JavaScript string when the call returns, and a test that allocated before `sqlite3_step` stored other text. Text columns come back as handles for `readCString`, and every statement is finalized by hand.';
export const expected = ({ sqlite3 }) => [`${sqlite3} 3`, "2: write the README\n3: fix the parser's bug"];

export default async function example({ sqlite3_libversion, sqlite3_open, sqlite3_close, sqlite3_exec, sqlite3_prepare_v2, sqlite3_bind_text, sqlite3_step, sqlite3_column_int, sqlite3_column_text, sqlite3_finalize, sqlite3_errmsg, SQLITE_OK, SQLITE_ROW, allocPointer, readPointerAt, writeNumberAt, readCString }, console) {
    const ok = await SQLITE_OK, row = await SQLITE_ROW;
    // SQLITE_TRANSIENT, ((sqlite3_destructor_type)-1), has no binding because its value is a pointer:
    // the address -1, which a 4-byte slot holding -1 reads back in wasm32.
    const minusOne = await allocPointer(1);
    await writeNumberAt(minusOne, 0, 'int32', -1);
    const SQLITE_TRANSIENT = await readPointerAt(minusOne, 0);

    // sqlite3_open and sqlite3_prepare_v2 hand back their handle through a pointer slot.
    const slot = await allocPointer(1);
    if (await sqlite3_open(':memory:', slot) !== ok) throw new Error('cannot open the database');
    const db = await readPointerAt(slot, 0);
    const prepare = async (sql) => {
        if (await sqlite3_prepare_v2(db, sql, -1, slot, null) !== ok) throw new Error(await sqlite3_errmsg(db));
        return await readPointerAt(slot, 0);
    };
    await sqlite3_exec(db, 'create table notes(id integer primary key, body text not null)', null, null, null);

    for (const body of ['buy milk', 'write the README', "fix the parser's bug"]) {
        const insert = await prepare('insert into notes(body) values (?1)');
        await sqlite3_bind_text(insert, 1, body, -1, SQLITE_TRANSIENT);
        await sqlite3_step(insert);
        if (await sqlite3_finalize(insert) !== ok) throw new Error(await sqlite3_errmsg(db));
    }

    const count = await prepare('select count(*) from notes');
    await sqlite3_step(count);
    console.log(await sqlite3_libversion(), await sqlite3_column_int(count, 0));
    await sqlite3_finalize(count);

    const find = await prepare("select id, body from notes where body like '%' || ?1 || '%' order by id");
    await sqlite3_bind_text(find, 1, 'the', -1, SQLITE_TRANSIENT);
    const lines = [];
    while (await sqlite3_step(find) === row) {
        lines.push(`${await sqlite3_column_int(find, 0)}: ${await readCString(await sqlite3_column_text(find, 1))}`);
    }
    if (await sqlite3_finalize(find) !== ok) throw new Error(await sqlite3_errmsg(db));
    console.log(lines.join('\n'));
    await sqlite3_close(db);
}
