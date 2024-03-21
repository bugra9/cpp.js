#include "native.h"

std::string Native::sample() {
    OGRSpatialReference srFrom;
    srFrom.SetWellKnownGeogCS("WGS84");
    srFrom.SetUTM(33, true);

    OGRSpatialReference srTo;
    srTo.SetWellKnownGeogCS("WGS84");

    OGRCoordinateTransformation* coordTrans =
    OGRCreateCoordinateTransformation(&srFrom, &srTo);

    double x1 = 1291784.057793292;
    double y1 = 2724159.114436987;

    int reprojected = coordTrans->Transform(1, &x1, &y1);
    return "This message comes from cpp and " + std::to_string(x1);
}

int getVersion() {
    return 1;
}
