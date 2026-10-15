export const imports = {
    '@crossbind/port-proj/proj.h': [
        'proj_context_create',
        'proj_context_destroy',
        'proj_context_errno',
        'proj_context_errno_string',
        'proj_create',
        'proj_destroy',
        'proj_identify',
        'proj_list_get',
        'proj_list_destroy',
        'proj_int_list_destroy',
        'proj_get_id_auth_name',
        'proj_get_id_code',
        'proj_get_name',
        'proj_get_crs_list_parameters_create',
        'proj_get_crs_list_parameters_destroy',
        'proj_get_crs_info_list_from_database',
        'proj_crs_info_list_destroy',
        'PJ_TYPE',
        'allocBuffer',
        'allocPointer',
        'readPointerAt',
        'readNumberAt',
        'writeNumberAt',
        'readCString',
    ],
};
export const note = '`proj_identify` hands its confidences back through an `int **`: JavaScript passes an `allocPointer` slot, reads the array PROJ put there with `readNumberAt` and frees it with `proj_int_list_destroy`. The point search is the C++\'s: the `PROJ_CRS_LIST_PARAMETERS` that `proj_get_crs_list_parameters_create` returns crosses with its fields, and `types` takes a one-element `PJ_TYPE` array in an `allocBuffer`. The list that comes back is a `PROJ_CRS_INFO **`, whose entries arrive as handles rather than objects, so `auth_name`, `code` and `name`, the first three fields and all `char *`, are read as the entry\'s first three pointers with `readPointerAt` and `readCString`.';
export const expected = [
    'EPSG:32635 WGS 84 / UTM zone 35N, confidence 100',
    'EPSG:32635 WGS 84 / UTM zone 35N, confidence 70',
    'Istanbul: EPSG:32635 WGS 84 / UTM zone 35N',
    'Sydney: EPSG:32756 WGS 84 / UTM zone 56S',
];

export default async function example({ proj_context_create, proj_context_destroy, proj_context_errno, proj_context_errno_string, proj_create, proj_destroy, proj_identify, proj_list_get, proj_list_destroy, proj_int_list_destroy, proj_get_id_auth_name, proj_get_id_code, proj_get_name, proj_get_crs_list_parameters_create, proj_get_crs_list_parameters_destroy, proj_get_crs_info_list_from_database, proj_crs_info_list_destroy, PJ_TYPE, allocBuffer, allocPointer, readPointerAt, readNumberAt, writeNumberAt, readCString }, console) {
    const context = await proj_context_create();
    const label = async (crs) => `${await proj_get_id_auth_name(crs, 0)}:${await proj_get_id_code(crs, 0)} ${await proj_get_name(crs)}`;
    const prj =
        'PROJCS["WGS_1984_UTM_Zone_35N",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",27.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]';
    const confidences = await allocPointer(1); // int **
    for (const definition of [prj, '+proj=utm +zone=35 +datum=WGS84 +units=m +no_defs +type=crs']) {
        const crs = await proj_create(context, definition);
        if (!crs) throw new Error(await proj_context_errno_string(context, await proj_context_errno(context)));
        const matches = await proj_identify(context, crs, 'EPSG', null, confidences);
        const confidence = await readPointerAt(confidences, 0); // an int array PROJ allocated
        const best = await proj_list_get(context, matches, 0); // the best match comes first
        console.log(`${await label(best)}, confidence ${await readNumberAt(confidence, 0, 'int32')}`);
        await proj_destroy(best);
        await proj_int_list_destroy(confidence);
        await proj_list_destroy(matches);
        await proj_destroy(crs);
    }

    // The projected CRSs whose area of use contains the point, deprecated ones left out, and the first
    // whose name has 'WGS 84 / UTM zone'.
    const types = await allocBuffer(4); // a PJ_TYPE array of one
    await writeNumberAt(types, 0, 'int32', (await PJ_TYPE.PJ_TYPE_PROJECTED_CRS).value);
    const count = await allocBuffer(4); // int *
    const text = async (entry, field) => readCString(await readPointerAt(entry, field));
    for (const [place, lat, lon] of [['Istanbul', 41.0082, 28.9784], ['Sydney', -33.8688, 151.2093]]) {
        const filter = await proj_get_crs_list_parameters_create();
        filter.types = types;
        filter.typesCount = 1;
        filter.bbox_valid = 1;
        filter.west_lon_degree = lon;
        filter.east_lon_degree = lon;
        filter.south_lat_degree = lat;
        filter.north_lat_degree = lat;
        filter.crs_area_of_use_contains_bbox = 1;
        const found = await proj_get_crs_info_list_from_database(context, 'EPSG', filter, count);
        const total = await readNumberAt(count, 0, 'int32');
        for (let index = 0; index < total; index += 1) {
            const crs = await readPointerAt(found, index); // a PROJ_CRS_INFO: auth_name, code, name, ...
            const name = await text(crs, 2);
            if (name.includes('WGS 84 / UTM zone')) {
                console.log(`${place}: ${await text(crs, 0)}:${await text(crs, 1)} ${name}`);
                break;
            }
        }
        await proj_crs_info_list_destroy(found);
        await proj_get_crs_list_parameters_destroy(filter);
    }
    await proj_context_destroy(context);
}
