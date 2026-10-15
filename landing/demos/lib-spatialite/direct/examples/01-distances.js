export const imports = {
    '@crossbind/port-spatialite/spatialite.h': ['spatialite_version', 'spatialite_alloc_connection', 'spatialite_init_ex', 'spatialite_cleanup_ex'],
    '@crossbind/port-sqlite3/sqlite3.h': [
        'sqlite3_open',
        'sqlite3_exec',
        'sqlite3_errmsg',
        'sqlite3_prepare_v2',
        'sqlite3_step',
        'sqlite3_column_text',
        'sqlite3_finalize',
        'sqlite3_close',
        'SQLITE_OK',
        'SQLITE_ROW',
        'allocPointer',
        'readPointerAt',
        'readCString',
    ],
};
export const note = 'The same calls `spatial_database.h` makes, on `sqlite3.h` and `spatialite.h` as the ports ship them. The `sqlite3 **` and `sqlite3_stmt **` out-parameters are a slot from `allocPointer` read back with `readPointerAt`, `sqlite3_column_text` returns a pointer that `readCString` reads, and `SQLITE_OK` and `SQLITE_ROW` are imported by name and read once with `await`.';
export const expected = ({ spatialite }) => [`${spatialite} 3`, 'Istanbul 0 km, Izmir 327 km, Ankara 350 km'];

export default async function example({ spatialite_version, spatialite_alloc_connection, spatialite_init_ex, spatialite_cleanup_ex, sqlite3_open, sqlite3_exec, sqlite3_errmsg, sqlite3_prepare_v2, sqlite3_step, sqlite3_column_text, sqlite3_finalize, sqlite3_close, SQLITE_OK, SQLITE_ROW, allocPointer, readPointerAt, readCString }, console) {
    const ok = await SQLITE_OK;
    const row = await SQLITE_ROW;
    const slot = await allocPointer(1);
    if ((await sqlite3_open(':memory:', slot)) !== ok) throw new Error('cannot open the database');
    const db = await readPointerAt(slot, 0);
    const cache = await spatialite_alloc_connection();
    await spatialite_init_ex(db, cache, 0);
    const exec = async (sql) => {
        if ((await sqlite3_exec(db, sql, null, null, null)) !== ok) throw new Error(await sqlite3_errmsg(db));
    };
    const scalar = async (sql) => {
        if ((await sqlite3_prepare_v2(db, sql, -1, slot, null)) !== ok) throw new Error(await sqlite3_errmsg(db));
        const statement = await readPointerAt(slot, 0);
        const text = (await sqlite3_step(statement)) === row ? await sqlite3_column_text(statement, 0) : null;
        const value = text === null ? '' : await readCString(text);
        await sqlite3_finalize(statement);
        return value;
    };

    await exec(`
        SELECT InitSpatialMetaData(1, 'WGS84');
        CREATE TABLE cities (name TEXT NOT NULL);
        SELECT AddGeometryColumn('cities', 'geom', 4326, 'POINT', 'XY');
        INSERT INTO cities (name, geom) VALUES
            ('Istanbul', GeomFromText('POINT(28.9784 41.0082)', 4326)),
            ('Ankara', GeomFromText('POINT(32.8597 39.9334)', 4326)),
            ('Izmir', GeomFromText('POINT(27.1428 38.4237)', 4326));
    `);
    console.log(await spatialite_version(), await scalar('SELECT count(*) FROM cities'));
    console.log(await scalar(`
        SELECT group_concat(name || ' ' || km || ' km', ', ' ORDER BY km)
        FROM (SELECT name, CAST(Round(ST_Distance(geom, MakePoint(28.9784, 41.0082, 4326), 1) / 1000) AS INTEGER) AS km FROM cities)
    `));
    await sqlite3_close(db);
    await spatialite_cleanup_ex(cache);
}
