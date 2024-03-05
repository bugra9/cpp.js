import Gdal5 from 'cppjs-package-gdal/Gdal.i';
// import Gdal1 from 'cppjs-package-gdal/MajorObject.i';
import Native5 from './native/native.h';

Native5().then(async ({
    Native, Gdal, Dataset, VectorString, FS, ...Native2
}) => {
    console.log(Native2);
    console.log(Native.sample());

    Gdal.allRegister();

    const papszAllowedDrivers = new VectorString();
    const papszOpenOptions = new VectorString();
    const papszSiblingFiles = new VectorString();

    // papszOpenOptions.push_back();

    const data = await fetch('https://gdal3.js.org/test/data/simple-polygon-line-point.tif').then((response) => response.arrayBuffer());
    FS.mkdir('input');
    FS.writeFile('/input/simple-polygon-line-point.tif', new Int8Array(data));

    const dataset = Gdal.OpenEx('/input/simple-polygon-line-point.tif', 0, papszAllowedDrivers, papszOpenOptions, papszSiblingFiles);
    if (dataset) {
        console.log(dataset.getRasterXSize());
    }
});
