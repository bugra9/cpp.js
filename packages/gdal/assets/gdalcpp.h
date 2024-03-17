#ifndef _GDALCPP_I
#define _GDALCPP_I

#include <memory>

#include "cpl_port.h"
#include "cpl_string.h"
#include "cpl_multiproc.h"
#include "cpl_http.h"
#include "cpl_vsi_error.h"
#include "cpl_error.h"

#include "gdal.h"
#include "gdal_alg.h"
#include "gdal_utils.h"

class Dataset;
class Driver;
class SubdatasetInfo;
class GCP;

class Gdal {
public:
    friend class Dataset;
    friend class Driver;
    friend class SubdatasetInfo;
    friend class GCP;
    // static CPLErrorHandler setErrorHandler(CPLErrorHandler);
    static void setCurrentErrorHandlerCatchDebug(int bCatchDebug);
    // static void pushErrorHandler(CPLErrorHandler);
    static void error(int eErrClass, int err_no, std::string fmt);
    static std::string goa2GetAuthorizationURL(std::string pszScope);
    static std::string goa2GetRefreshToken(std::string pszAuthToken, std::string pszScope);
    static std::string goa2GetAccessToken(std::string pszRefreshToken, std::string pszScope);
    static void popErrorHandler();
    static void errorReset();
    static std::string escapeString(std::string pszString, int nLength, int nScheme);
    static int getLastErrorNo();
    static int getLastErrorType();
    static std::string getLastErrorMsg();
    static int getErrorCounter();
    static int vsiGetLastErrorNo();
    static std::string vsiGetLastErrorMsg();
    static void vsiErrorReset();
    static void pushFinderLocation(std::string);
    static void popFinderLocation();
    static void finderClean();
    static std::string findFile(std::string pszClass, std::string pszBasename);
    static std::vector<std::string> readDir(std::string pszDirname);
    static std::vector<std::string> readDirRecursive(std::string pszPath);
    static void setConfigOption(std::string, std::string);
    static void setThreadLocalConfigOption(std::string pszKey, std::string pszValue);
    static std::string getConfigOption(std::string, std::string);
    static std::string getGlobalConfigOption(std::string, std::string);
    static std::string getThreadLocalConfigOption(std::string, std::string);
    static std::vector<std::string> getConfigOptions();
    static void setPathSpecificOption(std::string pszPathPrefix, std::string pszKey, std::string pszValue);
    static std::string getPathSpecificOption(std::string pszPath, std::string pszKey, std::string pszDefault);
    static void clearPathSpecificOptions(std::string pszPathPrefix);
    static std::string binaryToHex(int nBytes, std::vector<unsigned char> pabyData);
    static std::vector<unsigned char> hexToBinary(std::string pszHex);
    static int fileFromMemBuffer(std::string pszFilename, std::vector<unsigned char> pabyData);
    static int unlink(std::string pszFilename);
    static bool unlinkBatch(std::vector<std::string> papszFiles);
    static int mkdir(std::string pszDirname, long nMode);
    static int rmdir(std::string pszDirname);
    static int mkdirRecursive(std::string pszPathname, long mode);
    static int rmdirRecursive(std::string pszDirname);
    static int rename(std::string oldpath, std::string newpath);
    static int copyFile(std::string pszNewPath, std::string pszOldPath);
    static std::string getActualURL(std::string pszFilename);
    static std::string getSignedURL(std::string /*pszFilename*/, std::vector<std::string> /* papszOptions */);
    static std::vector<std::string> getFileSystemsPrefixes();
    static std::string getFileSystemOptions(std::string pszFilename);
    static std::vector<std::string> parseCommandLine(std::string pszCommandLine);
    static int getNumCPUs();
    static uint64_t getUsablePhysicalRAM();
    static int gcpsToGeoTransform(std::vector<std::shared_ptr<GCP>> pasGCPs, std::vector<double> padfGeoTransform, int bApproxOK);
    static std::shared_ptr<SubdatasetInfo> getSubdatasetInfo(std::string pszFileName);

    // static int computeMedianCutPCT(RasterBand hRed, RasterBand hGreen, RasterBand hBlue/*, int (*pfnIncludePixel)(int, int, void *) */, int nColors, ColorTable hColorTable, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int ditherRGB2PCT(RasterBand hRed, RasterBand hGreen, RasterBand hBlue, RasterBand hTarget, ColorTable hColorTable, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int reprojectImage(Dataset hSrcDS, std::string pszSrcWKT, Dataset hDstDS, std::string pszDstWKT, GDALResampleAlg eResampleAlg, double dfWarpMemoryLimit, double dfMaxError, GDALProgressFunc pfnProgress/*, void *pProgressArg*/, std::vector<GDALWarpOptions> psOptions);
    // static int computeProximity(RasterBand hSrcBand, RasterBand hProximityBand, std::vector<std::string> papszOptions, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int polygonize(RasterBand hSrcBand, RasterBand hMaskBand, Layer hOutLayer, int iPixValField, std::string papszOptions, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int fPolygonize(RasterBand hSrcBand, RasterBand hMaskBand, Layer hOutLayer, int iPixValField, std::string papszOptions, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int fillNodata(RasterBand hTargetBand, RasterBand hMaskBand, double dfMaxSearchDist, int bDeprecatedOption, int nSmoothingIterations, std::string papszOptions, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int sieveFilter(RasterBand hSrcBand, RasterBand hMaskBand, RasterBand hDstBand, int nSizeThreshold, int nConnectedness, std::string papszOptions, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int regenerateOverviews(RasterBand hSrcBand, int nOverviewCount, RasterBand *pahOverviewBands, std::string pszResampling, GDALProgressFunc pfnProgress, void *pProgressData);
    // static int gridCreate(GDALGridAlgorithm, const void *, int, std::vector<double>, std::vector<double>, std::vector<double>, double, double, double, double, int, int, int, void *, GDALProgressFunc, void *);
    // static int contourGenerate(RasterBand hBand, double dfContourInterval, double dfContourBase, int nFixedLevelCount, std::vector<double> padfFixedLevels, int bUseNoData, double dfNoDataValue, void *hLayer, int iIDField, int iElevField, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static int contourGenerateEx(RasterBand hBand, void *hLayer, std::vector<std::string> options, GDALProgressFunc pfnProgress/*, void *pProgressArg*/);
    // static Dataset viewshedGenerate(RasterBand hBand, std::string pszDriverName, std::string pszTargetRasterName, std::vector<std::string> papszCreationOptions, double dfObserverX, double dfObserverY, double dfObserverHeight, double dfTargetHeight, double dfVisibleVal, double dfInvisibleVal, double dfOutOfRangeVal, double dfNoDataVal, double dfCurvCoeff, GDALViewshedMode eMode, double dfMaxDistance, GDALProgressFunc pfnProgress/*, void *pProgressArg*/, GDALViewshedOutputType heightMode, std::vector<std::string> papszExtraOptions);
    // static Dataset autoCreateWarpedVRT(Dataset hSrcDS, std::string pszSrcWKT, std::string pszDstWKT, GDALResampleAlg eResampleAlg, double dfMaxError, const GDALWarpOptions *psOptions);
    // static Dataset createPansharpenedVRT(std::string pszXML, RasterBand hPanchroBand, int nInputSpectralBands, std::vector<RasterBand> pahInputSpectralBands);
    // static SuggestedWarpOutputRes suggestedWarpOutput(Dataset hSrcDS, GDALTransformerFunc pfnTransformer);

    static std::vector<double> applyGeoTransform(std::vector<double>, double, double);
    static std::vector<double> invGeoTransform(std::vector<double> padfGeoTransformIn);

    static std::string versionInfo(std::string pszRequest);
    static void allRegister();
    static void registerPlugins();
    static int registerPlugin(std::string name);
    static void destroyDriverManager();
    static int getCacheMax();
    static int getCacheUsed();
    static void setCacheMax(int nBytes);
    static int getDataTypeSize(int);
    static int dataTypeIsComplex(int);
    static std::string getDataTypeName(int);
    static int getDataTypeByName(std::string);
    static int dataTypeUnion(int, int);
    static std::string getColorInterpretationName(int);
    static std::string getPaletteInterpretationName(int);
    static std::string decToDMS(double, std::string, int);
    static double packedDMSToDec(double);
    static double decToPackedDMS(double);
    static int getDriverCount();
    static std::shared_ptr<Driver> getDriverByName(std::string);
    static std::shared_ptr<Driver> getDriver(int);
    static std::shared_ptr<Dataset> open(std::string pszFilename, int eAccess);
    static std::shared_ptr<Dataset> openEx(std::string pszFilename, unsigned int nOpenFlags, std::vector<std::string> papszAllowedDrivers, std::vector<std::string> papszOpenOptions, std::vector<std::string> papszSiblingFiles);
    static std::shared_ptr<Dataset> openShared(std::string, int);
    static std::shared_ptr<Driver> identifyDriver(std::string pszFilename, std::vector<std::string> papszFileList);
    static std::shared_ptr<Driver> identifyDriverEx(std::string pszFilename, unsigned int nIdentifyFlags, std::vector<std::string> papszAllowedDrivers, std::vector<std::string>papszFileList);

    static std::string info(std::shared_ptr<Dataset> hDataset, std::vector<std::string> psOptions);
    static std::string vectorInfo(std::shared_ptr<Dataset> hDataset, std::vector<std::string> psOptions);
    static std::string multiDimInfo(std::shared_ptr<Dataset> hDataset, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> translate(std::string pszDestFilename, std::shared_ptr<Dataset> hSrcDataset, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> warp(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> vectorTranslate(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> demProcessing(std::string pszDestFilename, std::shared_ptr<Dataset> hSrcDataset, std::string pszProcessing, std::string pszColorFilename, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> nearblack(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> grid(std::string pszDest, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> rasterize(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> footprint(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> buildVRT(std::string pszDest, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> papszSrcDSNames, std::vector<std::string> psOptions);
    static std::shared_ptr<Dataset> multiDimTranslate(std::string pszDest, std::shared_ptr<Dataset> hDstDataset, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> psOptions);

private:
    static std::string charPtrToString(const char *);
    static std::vector<std::string> charPtrPtrToStringVector(char **);
    static std::vector<double> doublePtrToDoubleVector(double* doublearray);
};

class Dataset {
public:
    friend class Gdal;
    friend class Driver;

    ~Dataset();
    int buildOverviews(std::string resampling, std::vector<int> overviewlist, std::vector<std::string> options);
    std::vector<std::shared_ptr<GCP>> getGCPs();
    std::vector<double> getGeoTransform();
    // std::shared_ptr<Layer> getLayer(int index);
    // std::shared_ptr<Layer> getLayer(std::string layerName);
    int getRasterXSize();
    int getRasterYSize();
    int getRasterCount();
    int close();
    std::shared_ptr<Driver> getDriver();
    // std::shared_ptr<Band> getRasterBand(int nBand);
    // std::shared_ptr<Group> getRootGroup();
    std::string getProjectionRef();
    // std::shared_ptr<SpatialReference> getSpatialRef();
    int setProjection(std::string prj);
    // int setSpatialRef(std::shared_ptr<SpatialReference> srs);
    int setGeoTransform(std::vector<double> argin);
    int getGCPCount();
    std::string getGCPProjection();
    // std::shared_ptr<SpatialReference> getGCPSpatialRef();
    int setGCPs(std::vector<std::shared_ptr<GCP>> nGCPs, std::string pszGCPProjection);
    // int setGCPs2(std::vector<std::shared_ptr<GCP>> nGCPs, std::shared_ptr<SpatialReference> hSRS);
    int flushCache();
    int addBand(int datatype, std::vector<std::string> options);
    int createMaskBand(int nFlags);
    std::vector<std::string> getFileList();
    // int adviseRead(int xoff, int yoff, int xsize, int ysize, int buf_xsize, int buf_ysize, int buf_type, std::vector<int> band_list, std::vector<std::string> options);
    // std::shared_ptr<Layer> createLayer(std::string name, std::shared_ptr<SpatialReference> srs, int geom_type, std::vector<std::string> options);
    // std::shared_ptr<Layer> copyLayer(std::shared_ptr<Layer> src_layer, std::string new_name, std::vector<std::string> options);
    int deleteLayer(int index);
    int getLayerCount();
    bool isLayerPrivate(int index);
    // std::shared_ptr<Layer> getLayerByIndex(int index);
    // std::shared_ptr<Layer> getLayerByName(std::string layer_name);
    void resetReading();
    // std::shared_ptr<Feature> getNextFeature();
    bool testCapability(std::string cap);
    // std::shared_ptr<Layer> executeSQL(std::string statement, std::shared_ptr<Geometry> spatialFilter, std::string dialect);
    // void releaseResultSet(std::shared_ptr<Layer> layer);
    // std::shared_ptr<StyleTable> getStyleTable();
    // void setStyleTable(std::shared_ptr<StyleTable> table);
    int abortSQL();
    int startTransaction(int force);
    int commitTransaction();
    int rollbackTransaction();
    void clearStatistics();
    std::vector<std::string> getFieldDomainNames(std::vector<std::string> options);
    // std::shared_ptr<FieldDomain> getFieldDomain(std::string name);
    // bool addFieldDomain(std::shared_ptr<FieldDomain> fieldDomain);
    bool deleteFieldDomain(std::string name);
    // bool updateFieldDomain(std::shared_ptr<FieldDomain> fieldDomain);
    std::vector<std::string> getRelationshipNames(std::vector<std::string> options);
    // std::shared_ptr<Relationship> getRelationship(std::string name);
    // bool addRelationship(std::shared_ptr<Relationship> relationship);
    bool deleteRelationship(std::string name);
    // bool updateRelationship(std::shared_ptr<Relationship> relationship);
    // int readRaster(int xoff, int yoff, int xsize, int ysize, int buf_xsize, int buf_ysize, int buf_type, std::vector<uint8_t> regularArrayOut, std::vector<int> band_list, int nPixelSpace, int nLineSpace, int nBandSpace);
    // int writeRaster(int xoff, int yoff, int xsize, int ysize, int buf_xsize, int buf_ysize, int buf_type, std::vector<uint8_t> regularArrayIn, std::vector<int> band_list, int nPixelSpace, int nLineSpace, int nBandSpace);


private:
    Dataset(void* dataset);
    static std::shared_ptr<Dataset> Create(void* dataset);

    struct MakeSharedEnabler;
    void *ptr;
};

class Driver {
public:
    friend class Gdal;
    friend class Dataset;
    ~Driver();

    std::string getShortName();
    std::string getLongName();
    std::string getHelpTopic();
    std::shared_ptr<Dataset> create(std::string utf8_path, int xsize, int ysize, int bands, int eType, std::vector<std::string> options);
    std::shared_ptr<Dataset> createMultiDimensional(std::string utf8_path, std::vector<std::string> root_group_options, std::vector<std::string> options);
    std::shared_ptr<Dataset> createCopy(std::string utf8_path, std::shared_ptr<Dataset> src, int strict, std::vector<std::string> options);
    int deleteDriver(std::string utf8_path);
    int rename(std::string newName, std::string oldName);
    int copyFiles(std::string newName, std::string oldName);
    int registerDriver();
    void deregisterDriver();


private:
    Driver(void*);
    static std::shared_ptr<Driver> Create(void*);

    struct MakeSharedEnabler;
    void *ptr;
};

class SubdatasetInfo {
public:
    friend class Gdal;
    SubdatasetInfo(std::string pszFileName);
    ~SubdatasetInfo();

    std::string getPathComponent();
    std::string getSubdatasetComponent();
    std::string modifyPathComponent(std::string pszNewFileName);

private:
    SubdatasetInfo(void*);
    static std::shared_ptr<SubdatasetInfo> Create(void*);

    struct MakeSharedEnabler;
    void *ptr;
};

class GCP {
public:
    friend class Gdal;
    friend class Dataset;

    GCP(double x, double y, double z, double pixel, double line, std::string info, std::string id);
    ~GCP();
    double getX();
    double getY();
    double getZ();
    double getPixel();
    double getLine();
    std::string getInfo();
    std::string getId();

    void setX(double x);
    void setY(double y);
    void setZ(double z);
    void setPixel(double pixel);
    void setLine(double line);
    void setInfo(std::string info);
    void setId(std::string id);

private:
    GCP(void*);
    static std::shared_ptr<GCP> Create(void*);

    struct MakeSharedEnabler;
    void *ptr;
};
// ===============================================================================

// =================================================== GDAL - PUBLIC =============
// CPLErrorHandler Gdal::setErrorHandler(CPLErrorHandler) {}
void Gdal::setCurrentErrorHandlerCatchDebug(int bCatchDebug) {
    CPLSetCurrentErrorHandlerCatchDebug(bCatchDebug);
}
// void Gdal::pushErrorHandler(CPLErrorHandler) {}
void Gdal::error(int eErrClass, int err_no, std::string fmt) {
    CPLError((CPLErr) eErrClass, err_no, "%s", fmt.c_str());
}
std::string Gdal::goa2GetAuthorizationURL(std::string pszScope) {
    return charPtrToString(GOA2GetAuthorizationURL(pszScope.c_str()));
}
std::string Gdal::goa2GetRefreshToken(std::string pszAuthToken, std::string pszScope) {
    return charPtrToString(GOA2GetRefreshToken(pszAuthToken.c_str(), pszScope.c_str()));
}
std::string Gdal::goa2GetAccessToken(std::string pszRefreshToken, std::string pszScope) {
    return charPtrToString(GOA2GetAccessToken(pszRefreshToken.c_str(), pszScope.c_str()));
}
void Gdal::popErrorHandler() {
    CPLPopErrorHandler();
}
void Gdal::errorReset() {
    CPLErrorReset();
}
std::string Gdal::escapeString(std::string pszString, int nLength, int nScheme) {
    return charPtrToString((const char *) CPLEscapeString(pszString.c_str(), nLength, nScheme));
}
int Gdal::getLastErrorNo() {
    return (int) CPLGetLastErrorNo();
}
int Gdal::getLastErrorType() {
    return (int) CPLGetLastErrorType();
}
std::string Gdal::getLastErrorMsg() {
    return charPtrToString(CPLGetLastErrorMsg());
}
int Gdal::getErrorCounter() {
    return CPLGetErrorCounter();
}
int Gdal::vsiGetLastErrorNo() {
    return VSIGetLastErrorNo();
}
std::string Gdal::vsiGetLastErrorMsg() {
    return charPtrToString(VSIGetLastErrorMsg());
}
void Gdal::vsiErrorReset() {
    CPLErrorReset();
}
void Gdal::pushFinderLocation(std::string l) {
    CPLPushFinderLocation(l.c_str());
}
void Gdal::popFinderLocation() {
    CPLPopFinderLocation();
}
void Gdal::finderClean() {
    CPLFinderClean();
}
std::string Gdal::findFile(std::string pszClass, std::string pszBasename) {
    return charPtrToString(CPLFindFile(pszClass.c_str(), pszBasename.c_str()));
}
std::vector<std::string> Gdal::readDir(std::string pszDirname) {
    return charPtrPtrToStringVector(VSIReadDir(pszDirname.c_str()));
}
std::vector<std::string> Gdal::readDirRecursive(std::string pszPath) {
    return charPtrPtrToStringVector(VSIReadDirRecursive(pszPath.c_str()));
}
void Gdal::setConfigOption(std::string key, std::string value) {
    CPLSetConfigOption(key.c_str(), value.c_str());
}
void Gdal::setThreadLocalConfigOption(std::string pszKey, std::string pszValue) {
    CPLSetThreadLocalConfigOption(pszKey.c_str(), pszValue.c_str());
}
std::string Gdal::getConfigOption(std::string key, std::string def) {
    return charPtrToString(CPLGetConfigOption(key.c_str(), def.c_str()));
}
std::string Gdal::getGlobalConfigOption(std::string key, std::string def) {
    return charPtrToString(CPLGetGlobalConfigOption(key.c_str(), def.c_str()));
}
std::string Gdal::getThreadLocalConfigOption(std::string key, std::string def) {
    return charPtrToString(CPLGetThreadLocalConfigOption(key.c_str(), def.c_str()));
}
std::vector<std::string> Gdal::getConfigOptions() {
    return charPtrPtrToStringVector(CPLGetConfigOptions());
}
void Gdal::setPathSpecificOption(std::string pszPathPrefix, std::string pszKey, std::string pszValue) {
    VSISetPathSpecificOption(pszPathPrefix.c_str(), pszKey.c_str(), pszValue.c_str());
}
std::string Gdal::getPathSpecificOption(std::string pszPath, std::string pszKey, std::string pszDefault) {
    return charPtrToString(VSIGetPathSpecificOption(pszPath.c_str(), pszKey.c_str(), pszDefault.c_str()));
}
void Gdal::clearPathSpecificOptions(std::string pszPathPrefix) {
    VSIClearPathSpecificOptions(pszPathPrefix.c_str());
}
std::string Gdal::binaryToHex(int nBytes, std::vector<unsigned char> pabyData) {
    return charPtrToString(CPLBinaryToHex(nBytes, pabyData.data()));
}
std::vector<unsigned char> Gdal::hexToBinary(std::string pszHex) {
    std::vector<unsigned char> output;
    int *arg2 = (int *) 0 ;
    int nBytes1;
    arg2 = &nBytes1;

    unsigned char *result = CPLHexToBinary(pszHex.c_str(), arg2);
    output.assign(result, result + nBytes1);

    return output;
}
int Gdal::fileFromMemBuffer(std::string pszFilename, std::vector<unsigned char> pabyData) {
    int nBytes = pabyData.size();
    GByte* pabyDataDup = (GByte*)VSIMalloc(nBytes);
    if (pabyDataDup == NULL)
            return -1;
    memcpy(pabyDataDup, pabyData.data(), nBytes);
    VSILFILE *fp = VSIFileFromMemBuffer(pszFilename.c_str(), (GByte*) pabyDataDup, nBytes, TRUE);

    if (fp == NULL) {
        VSIFree(pabyDataDup);
        return -1;
    } else {
        VSIFCloseL(fp);
        return 0;
    }
}
int Gdal::unlink(std::string pszFilename) {
    return VSIUnlink(pszFilename.c_str());
}
bool Gdal::unlinkBatch(std::vector<std::string> papszFiles) {
    std::vector<const char *>papszFiles2(papszFiles.size());
    for (auto &a : papszFiles) {
        papszFiles2.push_back(a.c_str());
    }
    auto files = papszFiles2.data();

    int* success = VSIUnlinkBatch(papszFiles2.data());
    if( !success ) return false;
    int bRet = true;
    for(int i = 0; files && files[i]; i++) {
        if (!success[i]) {
            bRet = false;
            break;
        }
    }
    VSIFree(success);
    return bRet;
}
int Gdal::mkdir(std::string pszDirname, long nMode) {
    return VSIMkdir(pszDirname.c_str(), nMode);
}
int Gdal::rmdir(std::string pszDirname) {
    return VSIRmdir(pszDirname.c_str());
}
int Gdal::mkdirRecursive(std::string pszPathname, long mode) {
    return VSIMkdirRecursive(pszPathname.c_str(), mode);
}
int Gdal::rmdirRecursive(std::string pszDirname) {
    return VSIRmdirRecursive(pszDirname.c_str());
}
int Gdal::rename(std::string oldpath, std::string newpath) {
    return VSIRename(oldpath.c_str(), newpath.c_str());
}
int Gdal::copyFile(std::string pszNewPath, std::string pszOldPath) {
    return VSICopyFile(pszNewPath.c_str(), pszOldPath.c_str(), NULL, static_cast<vsi_l_offset>(-1), NULL, NULL, NULL);
}
std::string Gdal::getActualURL(std::string pszFilename) {
    return charPtrToString(VSIGetActualURL(pszFilename.c_str()));
}
std::string Gdal::getSignedURL(std::string pszFilename, std::vector<std::string> papszOptions) {
    std::vector<const char *>papszOptions2(papszOptions.size());
    for (auto &a : papszOptions) {
        papszOptions2.push_back(a.c_str());
    }

    return charPtrToString(VSIGetSignedURL(pszFilename.c_str(), papszOptions2.data()));
}
std::vector<std::string> Gdal::getFileSystemsPrefixes() {
    return charPtrPtrToStringVector(VSIGetFileSystemsPrefixes());
}
std::string Gdal::getFileSystemOptions(std::string pszFilename) {
    return charPtrToString(VSIGetFileSystemOptions(pszFilename.c_str()));
}
std::vector<std::string> Gdal::parseCommandLine(std::string pszCommandLine) {
    return charPtrPtrToStringVector(CSLParseCommandLine(pszCommandLine.c_str()));
}
int Gdal::getNumCPUs() {
    return CPLGetNumCPUs();
}
uint64_t Gdal::getUsablePhysicalRAM() {
    return CPLGetUsablePhysicalRAM();
}
int Gdal::gcpsToGeoTransform(std::vector<std::shared_ptr<GCP>> pasGCPs, std::vector<double> padfGeoTransform, int bApproxOK = 1) {
    std::vector<void *>pasGCPs2(pasGCPs.size());
    for (auto &a : pasGCPs) {
        pasGCPs2.push_back(a->ptr);
    }

    return GDALGCPsToGeoTransform(pasGCPs2.size(), (GDAL_GCP const *) pasGCPs2.data(), padfGeoTransform.data(), bApproxOK); // CHECK: (GDAL_GCP const *)
}
std::shared_ptr<SubdatasetInfo> Gdal::getSubdatasetInfo(std::string pszFileName) {
    auto result = GDALGetSubdatasetInfo(pszFileName.c_str());
    if (result == 0) return NULL;
    return SubdatasetInfo::Create(result);
}
std::vector<double> Gdal::applyGeoTransform(std::vector<double> arg1, double arg2, double arg3) {
    double *arg4 = (double *) 0;
    double *arg5 = (double *) 0;

    double temp4 = (double)0; arg4 = &temp4;
    double temp5 = (double)0; arg5 = &temp5;

    GDALApplyGeoTransform(arg1.data(), arg2, arg3, arg4, arg5);

    std::vector<double> vect{(double)temp4, (double)temp5};
    return vect;
}
std::vector<double> Gdal::invGeoTransform(std::vector<double> padfGeoTransformIn) {
    double* arg2 = new double[padfGeoTransformIn.size()];

    int result = (int)GDALInvGeoTransform(padfGeoTransformIn.data(), arg2);
    if (result != 1) {
        return std::vector<double>();
    }

    return doublePtrToDoubleVector(arg2);
}
std::string Gdal::versionInfo(std::string pszRequest) {
    return charPtrToString(GDALVersionInfo(pszRequest.c_str()));
}
void Gdal::allRegister() {
    GDALAllRegister();
}
void Gdal::registerPlugins() {
    GDALRegisterPlugins();
}
int Gdal::registerPlugin(std::string name) {
    return (int) GDALRegisterPlugin(name.c_str());
}
void Gdal::destroyDriverManager() {
    GDALDestroyDriverManager();
}
int Gdal::getCacheMax() {
    return GDALGetCacheMax();
}
int Gdal::getCacheUsed() {
    return GDALGetCacheUsed();
}
void Gdal::setCacheMax(int nBytes) {
    GDALSetCacheMax(nBytes);
}
int Gdal::getDataTypeSize(int eDataType) {
    return GDALGetDataTypeSize((GDALDataType) eDataType);
}
int Gdal::dataTypeIsComplex(int eDataType) {
    return GDALDataTypeIsComplex((GDALDataType) eDataType);
}
std::string Gdal::getDataTypeName(int eDataType) {
    return charPtrToString(GDALGetDataTypeName((GDALDataType) eDataType));
}
int Gdal::getDataTypeByName(std::string name) {
    return GDALGetDataTypeByName(name.c_str());
}
int Gdal::dataTypeUnion(int a, int b) {
    return GDALDataTypeUnion((GDALDataType) a, (GDALDataType) b);
}
std::string Gdal::getColorInterpretationName(int eColorInterp) {
    return charPtrToString(GDALGetColorInterpretationName((GDALColorInterp) eColorInterp));
}
std::string Gdal::getPaletteInterpretationName(int ePaletteInterp) {
    return charPtrToString(GDALGetPaletteInterpretationName((GDALPaletteInterp) ePaletteInterp));
}
std::string Gdal::decToDMS(double a, std::string b, int c) {
    return charPtrToString(GDALDecToDMS(a, b.c_str(), c));
}
double Gdal::packedDMSToDec(double a) {
    return GDALPackedDMSToDec(a);
}
double Gdal::decToPackedDMS(double a) {
    return GDALDecToPackedDMS(a);
}
int Gdal::getDriverCount() {
    return GDALGetDriverCount();
}
std::shared_ptr<Driver> Gdal::getDriverByName(std::string name) {
    auto result = GDALGetDriverByName(name.c_str());
    if (result == 0) return NULL;
    return Driver::Create(result);
}
std::shared_ptr<Driver> Gdal::getDriver(int i) {
    auto result = GDALGetDriver(i);
    if (result == 0) return NULL;
    return Driver::Create(result);
}
std::shared_ptr<Dataset> Gdal::open(std::string pszFilename, int eAccess) {
    auto result = GDALOpen(pszFilename.c_str(), (GDALAccess) eAccess);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::openEx(std::string pszFilename, unsigned int nOpenFlags, std::vector<std::string> papszAllowedDrivers, std::vector<std::string> papszOpenOptions, std::vector<std::string> papszSiblingFiles) {
    std::vector<const char *>papszAllowedDrivers2(papszAllowedDrivers.size());
    for (auto &a : papszAllowedDrivers) {
        papszAllowedDrivers2.push_back(a.c_str());
    }

    std::vector<const char *>papszOpenOptions2(papszOpenOptions.size());
    for (auto &a : papszOpenOptions) {
        papszOpenOptions2.push_back(a.c_str());
    }

    std::vector<const char *>papszSiblingFiles2(papszSiblingFiles.size());
    for (auto &a : papszSiblingFiles) {
        papszSiblingFiles2.push_back(a.c_str());
    }

    auto result = GDALOpenEx(pszFilename.c_str(), nOpenFlags, papszAllowedDrivers2.data(), papszOpenOptions2.data(), papszSiblingFiles2.data());
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::openShared(std::string pszFilename, int eAccess) {
    auto result = GDALOpenShared(pszFilename.c_str(), (GDALAccess) eAccess);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Driver> Gdal::identifyDriver(std::string pszFilename, std::vector<std::string> papszFileList) {
    std::vector<const char *>papszFileList2(papszFileList.size());
    for (auto &a : papszFileList) {
        papszFileList2.push_back(a.c_str());
    }

    auto result = GDALIdentifyDriver(pszFilename.c_str(), papszFileList2.data());
    if (result == 0) return NULL;
    return Driver::Create(result);
}
std::shared_ptr<Driver> Gdal::identifyDriverEx(std::string pszFilename, unsigned int nIdentifyFlags, std::vector<std::string> papszAllowedDrivers, std::vector<std::string>papszFileList) {
    std::vector<const char *>papszAllowedDrivers2(papszAllowedDrivers.size());
    for (auto &a : papszAllowedDrivers) {
        papszAllowedDrivers2.push_back(a.c_str());
    }

    std::vector<const char *>papszFileList2(papszFileList.size());
    for (auto &a : papszFileList) {
        papszFileList2.push_back(a.c_str());
    }

    auto result = GDALIdentifyDriverEx(pszFilename.c_str(), nIdentifyFlags, papszAllowedDrivers2.data(), papszFileList2.data());
    if (result == 0) return NULL;
    return Driver::Create(result);
}


std::string Gdal::info(std::shared_ptr<Dataset> hDataset, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALInfoOptions* options = GDALInfoOptionsNew((char**) psOptions2.data(), NULL);
    auto result = GDALInfo(hDataset->ptr, options);
    GDALInfoOptionsFree(options);

    return charPtrToString(result);
}
std::string Gdal::vectorInfo(std::shared_ptr<Dataset> hDataset, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALVectorInfoOptions* options = GDALVectorInfoOptionsNew((char**) psOptions2.data(), NULL);
    auto result = GDALVectorInfo(hDataset->ptr, options);
    GDALVectorInfoOptionsFree(options);

    return charPtrToString(result);
}
std::string Gdal::multiDimInfo(std::shared_ptr<Dataset> hDataset, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALMultiDimInfoOptions* options = GDALMultiDimInfoOptionsNew((char**) psOptions2.data(), NULL);
    auto result = GDALMultiDimInfo(hDataset->ptr, options);
    GDALMultiDimInfoOptionsFree(options);

    return charPtrToString(result);
}
std::shared_ptr<Dataset> Gdal::translate(std::string pszDestFilename, std::shared_ptr<Dataset> hSrcDataset, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALTranslateOptions* options = GDALTranslateOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALTranslate(pszDestFilename.c_str(), hSrcDataset->ptr, options, &usageError);
    GDALTranslateOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::warp(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> psOptions) {
    std::vector<void *>pahSrcDS2(pahSrcDS.size());
    for (auto &a : pahSrcDS) {
        pahSrcDS2.push_back(a->ptr);
    }

    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALWarpAppOptions* options = GDALWarpAppOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALWarp(pszDest.c_str(), hDstDS->ptr, pahSrcDS2.size(), pahSrcDS2.data(), options, &usageError);
    GDALWarpAppOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::vectorTranslate(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> psOptions) {
    std::vector<void *>pahSrcDS2(pahSrcDS.size());
    for (auto &a : pahSrcDS) {
        pahSrcDS2.push_back(a->ptr);
    }

    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALVectorTranslateOptions* options = GDALVectorTranslateOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALVectorTranslate(pszDest.c_str(), hDstDS->ptr, pahSrcDS2.size(), pahSrcDS2.data(), options, &usageError);
    GDALVectorTranslateOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::demProcessing(std::string pszDestFilename, std::shared_ptr<Dataset> hSrcDataset, std::string pszProcessing, std::string pszColorFilename, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALDEMProcessingOptions* options = GDALDEMProcessingOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALDEMProcessing(pszDestFilename.c_str(), hSrcDataset->ptr, pszProcessing.c_str(), pszColorFilename.c_str(), options, &usageError);
    GDALDEMProcessingOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::nearblack(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALNearblackOptions* options = GDALNearblackOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALNearblack(pszDest.c_str(), hDstDS->ptr, hSrcDS->ptr, options, &usageError);
    GDALNearblackOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::grid(std::string pszDest, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALGridOptions* options = GDALGridOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALGrid(pszDest.c_str(), hSrcDS->ptr, options, &usageError);
    GDALGridOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::rasterize(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALRasterizeOptions* options = GDALRasterizeOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALRasterize(pszDest.c_str(), hDstDS->ptr, hSrcDS->ptr, options, &usageError);
    GDALRasterizeOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::footprint(std::string pszDest, std::shared_ptr<Dataset> hDstDS, std::shared_ptr<Dataset> hSrcDS, std::vector<std::string> psOptions) {
    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALFootprintOptions* options = GDALFootprintOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALFootprint(pszDest.c_str(), hDstDS->ptr, hSrcDS->ptr, options, &usageError);
    GDALFootprintOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::buildVRT(std::string pszDest, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> papszSrcDSNames, std::vector<std::string> psOptions) {
    std::vector<void *>pahSrcDS2(pahSrcDS.size());
    for (auto &a : pahSrcDS) {
        pahSrcDS2.push_back(a->ptr);
    }

    std::vector<const char *>papszSrcDSNames2(papszSrcDSNames.size());
    for (auto &a : papszSrcDSNames) {
        papszSrcDSNames2.push_back(a.c_str());
    }

    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALBuildVRTOptions* options = GDALBuildVRTOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALBuildVRT(pszDest.c_str(), pahSrcDS2.size(), pahSrcDS2.data(), papszSrcDSNames2.data(), options, &usageError);
    GDALBuildVRTOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Gdal::multiDimTranslate(std::string pszDest, std::shared_ptr<Dataset> hDstDataset, std::vector<std::shared_ptr<Dataset>> pahSrcDS, std::vector<std::string> psOptions) {
    std::vector<void *>pahSrcDS2(pahSrcDS.size());
    for (auto &a : pahSrcDS) {
        pahSrcDS2.push_back(a->ptr);
    }

    std::vector<const char *>psOptions2(psOptions.size());
    for (auto &a : psOptions) {
        psOptions2.push_back(a.c_str());
    }

    GDALMultiDimTranslateOptions* options = GDALMultiDimTranslateOptionsNew((char**) psOptions2.data(), NULL);
    int usageError;
    auto result = GDALMultiDimTranslate(pszDest.c_str(), hDstDataset->ptr, pahSrcDS2.size(), pahSrcDS2.data(), options, &usageError);
    GDALMultiDimTranslateOptionsFree(options);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}


// =================================================== GDAL - PRIVATE ============
std::string Gdal::charPtrToString(const char * result) {
    std::string output = "";
    if (result) {
      output = std::string(result);
      CPLFree((void *) result);
    }
    return output;
}

std::vector<std::string> Gdal::charPtrPtrToStringVector(char ** stringarray) {
    std::vector<std::string> output;
    if ( stringarray != NULL ) {
      while(*stringarray != NULL) {
        output.emplace_back(*stringarray);
        stringarray++;
      }
    }
    CSLDestroy(stringarray);
    return output;
}

std::vector<double> Gdal::doublePtrToDoubleVector(double* doublearray) {
    std::vector<double> output;
    if ( doublearray != NULL ) {
      while(*doublearray != NULL) {
        output.push_back(*doublearray);
        doublearray++;
      }
    }
    delete[] doublearray;
    return output;
}

// =================================================== DATASET - PUBLIC ==========
Dataset::~Dataset() {
    CPLFree(this->ptr);
}
int Dataset::buildOverviews(std::string resampling, std::vector<int> overviewlist, std::vector<std::string> options) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    return (int) GDALBuildOverviewsEx((GDALDatasetH) this->ptr, resampling.c_str(), overviewlist.size(), overviewlist.data(), 0, 0, NULL, NULL, options2.data());
}
std::vector<std::shared_ptr<GCP>> Dataset::getGCPs() {
    int *arg2 = (int *) 0 ;
    GDAL_GCP **arg3 = (GDAL_GCP **) 0 ;

    int *nGCPs = arg2;
    GDAL_GCP const **pGCPs = (GDAL_GCP const **)arg3;

    *nGCPs = GDALGetGCPCount((GDALDatasetH) this->ptr);
    *pGCPs = GDALGetGCPs((GDALDatasetH) this->ptr);

    std::vector<std::shared_ptr<GCP>> gcps;
    for (int i=0; i<*arg2; i++ ) {
        gcps.push_back(std::make_shared<GCP>(
            (*arg3)[i].dfGCPX, (*arg3)[i].dfGCPY, (*arg3)[i].dfGCPZ,
            (*arg3)[i].dfGCPPixel, (*arg3)[i].dfGCPLine,
            std::string((*arg3)[i].pszInfo), std::string((*arg3)[i].pszId)
        ));
    }
    return gcps;
}
std::vector<double> Dataset::getGeoTransform() {
    double argout[6];
    if ( GDALGetGeoTransform( (GDALDatasetH) this->ptr, argout ) != CE_None ) {
      argout[0] = 0.0;
      argout[1] = 1.0;
      argout[2] = 0.0;
      argout[3] = 0.0;
      argout[4] = 0.0;
      argout[5] = 1.0;
    }
    return std::vector<double>(argout, argout + sizeof argout / sizeof argout[0]);
}

int Dataset::getRasterXSize() {
    return GDALGetRasterXSize(this->ptr);
}
int Dataset::getRasterYSize() {
    return GDALGetRasterYSize(this->ptr);
}
int Dataset::getRasterCount() {
    return GDALGetRasterCount(this->ptr);
}
int Dataset::close() {
    return GDALClose(this->ptr);
}
std::shared_ptr<Driver> Dataset::getDriver() {
    auto result = GDALGetDatasetDriver(this->ptr);
    if (result == 0) return NULL;
    return Driver::Create(result);
}

std::string Dataset::getProjectionRef() {
    return Gdal::charPtrToString(GDALGetProjectionRef(this->ptr));
}
int Dataset::setProjection(std::string prj) {
    return GDALSetProjection(this->ptr, prj.c_str());
}
int Dataset::setGeoTransform(std::vector<double> argin) {
    return GDALSetGeoTransform(this->ptr, argin.data());
}
int Dataset::getGCPCount() {
    return GDALGetGCPCount(this->ptr);
}
std::string Dataset::getGCPProjection() {
    return Gdal::charPtrToString(GDALGetGCPProjection(this->ptr));
}
int Dataset::setGCPs(std::vector<std::shared_ptr<GCP>> nGCPs, std::string pszGCPProjection) {
    int arg2 = nGCPs.size();
    GDAL_GCP *arg3 = (GDAL_GCP *) 0;

    if (arg2 == 0) arg3 = NULL;
    else {
        arg3 = (GDAL_GCP*) malloc(sizeof(GDAL_GCP) * arg2);
        for (int i=0; i<arg2; i++) {
            arg3[i] = *(GDAL_GCP*) nGCPs[i]->ptr;
        }
    }

    return GDALSetGCPs(this->ptr, nGCPs.size(), (GDAL_GCP const *) arg3, pszGCPProjection.c_str());
}
int Dataset::flushCache() {
    return (int) GDALFlushCache(this->ptr);
}
int Dataset::addBand(int datatype, std::vector<std::string> options) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    return GDALAddBand(this->ptr, (GDALDataType) datatype, options2.data());
}
int Dataset::createMaskBand(int nFlags) {
    return GDALCreateDatasetMaskBand( this->ptr, nFlags );
}
std::vector<std::string> Dataset::getFileList() {
    return Gdal::charPtrPtrToStringVector(GDALGetFileList(this->ptr));
}
int Dataset::deleteLayer(int index) {
    return GDALDatasetDeleteLayer(this->ptr, index);
}
int Dataset::getLayerCount() {
    return GDALDatasetGetLayerCount(this->ptr);
}
bool Dataset::isLayerPrivate(int index) {
    return GDALDatasetIsLayerPrivate(this->ptr, index);
}
void Dataset::resetReading() {
    GDALDatasetResetReading(this->ptr);
}
bool Dataset::testCapability(std::string cap) {
    return (GDALDatasetTestCapability(this->ptr, cap.c_str()) > 0);
}
int Dataset::abortSQL() {
    return GDALDatasetAbortSQL(this->ptr);
}
int Dataset::startTransaction(int force) {
    return GDALDatasetStartTransaction(this->ptr, force);
}
int Dataset::commitTransaction() {
    return GDALDatasetCommitTransaction(this->ptr);
}
int Dataset::rollbackTransaction() {
    return GDALDatasetRollbackTransaction(this->ptr);
}
void Dataset::clearStatistics() {
    GDALDatasetClearStatistics(this->ptr);
}
std::vector<std::string> Dataset::getFieldDomainNames(std::vector<std::string> options) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    return Gdal::charPtrPtrToStringVector(GDALDatasetGetFieldDomainNames(this->ptr, options2.data()));
}
bool Dataset::deleteFieldDomain(std::string name) {
    return GDALDatasetDeleteFieldDomain(this->ptr, name.c_str(), NULL);
}
std::vector<std::string> Dataset::getRelationshipNames(std::vector<std::string> options) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    return Gdal::charPtrPtrToStringVector(GDALDatasetGetRelationshipNames(this->ptr, options2.data()));
}
bool Dataset::deleteRelationship(std::string name) {
    return GDALDatasetDeleteRelationship(this->ptr, name.c_str(), NULL);
}

// =================================================== DATASET - PRIVATE ========
Dataset::Dataset(void* dataset) {
    this->ptr = dataset;
}

struct Dataset::MakeSharedEnabler : public Dataset {
    template <typename... Args> MakeSharedEnabler(Args &&... args):Dataset(std::forward<Args>(args)...) {}
};

std::shared_ptr<Dataset> Dataset::Create(void* dataset) {
    return std::make_shared<MakeSharedEnabler>(dataset);
}

// =================================================== DRIVER - PUBLIC ==========
Driver::~Driver() {
    CPLFree(this->ptr);
}
std::string Driver::getShortName() {
    return Gdal::charPtrToString(GDALGetDriverShortName(this->ptr));
}
std::string Driver::getLongName() {
    return Gdal::charPtrToString(GDALGetDriverLongName(this->ptr));
}
std::string Driver::getHelpTopic() {
    return Gdal::charPtrToString(GDALGetDriverHelpTopic(this->ptr));
}
std::shared_ptr<Dataset> Driver::create(std::string utf8_path, int xsize, int ysize, int bands, int eType, std::vector<std::string> options = std::vector<std::string>()) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    auto result = GDALCreate(this->ptr, utf8_path.c_str(), xsize, ysize, bands, (GDALDataType) eType, options2.data());
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Driver::createMultiDimensional(std::string utf8_path, std::vector<std::string> root_group_options, std::vector<std::string> options = std::vector<std::string>()) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    std::vector<const char *>root_group_options2(root_group_options.size());
    for (auto &a : root_group_options) {
        root_group_options2.push_back(a.c_str());
    }

    auto result = GDALCreateMultiDimensional(this->ptr, utf8_path.c_str(), root_group_options2.data(), options2.data());
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
std::shared_ptr<Dataset> Driver::createCopy(std::string utf8_path, std::shared_ptr<Dataset> src, int strict, std::vector<std::string> options = std::vector<std::string>()) {
    std::vector<const char *>options2(options.size());
    for (auto &a : options) {
        options2.push_back(a.c_str());
    }

    auto result = GDALCreateCopy(this->ptr, utf8_path.c_str(), (GDALDatasetH) src->ptr, strict, options2.data(), NULL, NULL);
    if (result == 0) return NULL;
    return Dataset::Create(result);
}
int Driver::deleteDriver(std::string utf8_path) {
    return (int) GDALDeleteDataset(this->ptr, utf8_path.c_str());
}
int Driver::rename(std::string newName, std::string oldName) {
    return (int) GDALRenameDataset(this->ptr, newName.c_str(), oldName.c_str());
}
int Driver::copyFiles(std::string newName, std::string oldName) {
    return (int) GDALCopyDatasetFiles(this->ptr, newName.c_str(), oldName.c_str());
}
int Driver::registerDriver() {
    return (int) GDALRegisterDriver(this->ptr);
}
void Driver::deregisterDriver() {
    GDALDeregisterDriver(this->ptr);
}
// =================================================== DRIVER - PRIVATE ========
Driver::Driver(void* driver) {
    this->ptr = driver;
}

struct Driver::MakeSharedEnabler : public Driver {
    template <typename... Args> MakeSharedEnabler(Args &&... args):Driver(std::forward<Args>(args)...) {}
};

std::shared_ptr<Driver> Driver::Create(void* driver) {
    return std::make_shared<MakeSharedEnabler>(driver);
}

// =================================================== SUBDATASETINFO - PUBLIC ==========
SubdatasetInfo::SubdatasetInfo(std::string pszFileName) {
    SubdatasetInfo((void*) GDALGetSubdatasetInfo(CPLStrdup(pszFileName.c_str())));
}
SubdatasetInfo::~SubdatasetInfo() {
    CPLFree(this->ptr);
}
std::string SubdatasetInfo::getPathComponent() {
    return Gdal::charPtrToString(GDALSubdatasetInfoGetPathComponent((GDALSubdatasetInfoH) this->ptr));
}
std::string SubdatasetInfo::getSubdatasetComponent() {
    return Gdal::charPtrToString(GDALSubdatasetInfoGetSubdatasetComponent((GDALSubdatasetInfoH) this->ptr));
}
std::string SubdatasetInfo::modifyPathComponent(std::string pszNewFileName) {
    return Gdal::charPtrToString(GDALSubdatasetInfoModifyPathComponent((GDALSubdatasetInfoH) this->ptr, pszNewFileName.c_str()));
}
// =================================================== SUBDATASETINFO - PRIVATE ========
SubdatasetInfo::SubdatasetInfo(void* subdatasetInfo) {
    this->ptr = subdatasetInfo;
}

struct SubdatasetInfo::MakeSharedEnabler : public SubdatasetInfo {
    template <typename... Args> MakeSharedEnabler(Args &&... args):SubdatasetInfo(std::forward<Args>(args)...) {}
};

std::shared_ptr<SubdatasetInfo> SubdatasetInfo::Create(void* subdatasetInfo) {
    return std::make_shared<MakeSharedEnabler>(subdatasetInfo);
}

// =================================================== GCP - PUBLIC ==========
GCP::GCP(double x, double y, double z, double pixel, double line, std::string info = "", std::string id = "") {
    GDAL_GCP *self = (GDAL_GCP*) CPLMalloc( sizeof( GDAL_GCP ) );
    self->dfGCPX = x;
    self->dfGCPY = y;
    self->dfGCPZ = z;
    self->dfGCPPixel = pixel;
    self->dfGCPLine = line;
    self->pszInfo = CPLStrdup(info.c_str());
    self->pszId = CPLStrdup(id.c_str());
    GCP((void*) self);
}
GCP::~GCP() {
    GDAL_GCP* self = (GDAL_GCP*) this->ptr;
    CPLFree(self->pszInfo);
    CPLFree(self->pszId);
    CPLFree(this->ptr);
}

double GCP::getX() {
    return ((GDAL_GCP*) this->ptr)->dfGCPX;
}
double GCP::getY() {
    return ((GDAL_GCP*) this->ptr)->dfGCPY;
}
double GCP::getZ() {
    return ((GDAL_GCP*) this->ptr)->dfGCPZ;
}
double GCP::getPixel() {
    return ((GDAL_GCP*) this->ptr)->dfGCPPixel;
}
double GCP::getLine() {
    return ((GDAL_GCP*) this->ptr)->dfGCPLine;
}
std::string GCP::getInfo() {
    return Gdal::charPtrToString(((GDAL_GCP*) this->ptr)->pszInfo);
}
std::string GCP::getId() {
    return Gdal::charPtrToString(((GDAL_GCP*) this->ptr)->pszId);
}
void GCP::setX(double x) {
    ((GDAL_GCP*) this->ptr)->dfGCPX = x;
}
void GCP::setY(double y) {
    ((GDAL_GCP*) this->ptr)->dfGCPY = y;
}
void GCP::setZ(double z) {
    ((GDAL_GCP*) this->ptr)->dfGCPZ = z;
}
void GCP::setPixel(double pixel) {
    ((GDAL_GCP*) this->ptr)->dfGCPPixel = pixel;
}
void GCP::setLine(double line) {
    ((GDAL_GCP*) this->ptr)->dfGCPLine = line;
}
void GCP::setInfo(std::string info) {
    ((GDAL_GCP*) this->ptr)->pszInfo = CPLStrdup(info.c_str());
}
void GCP::setId(std::string id) {
    ((GDAL_GCP*) this->ptr)->pszId = CPLStrdup(id.c_str());
}
// =================================================== GCP - PRIVATE ========
GCP::GCP(void* gcp) {
    this->ptr = gcp;
}

struct GCP::MakeSharedEnabler : public GCP {
    template <typename... Args> MakeSharedEnabler(Args &&... args):GCP(std::forward<Args>(args)...) {}
};

std::shared_ptr<GCP> GCP::Create(void* gcp) {
    return std::make_shared<MakeSharedEnabler>(gcp);
}

#endif
