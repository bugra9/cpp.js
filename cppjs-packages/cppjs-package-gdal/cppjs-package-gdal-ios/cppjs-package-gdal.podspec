require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "gdal"
  s.name         = "cppjs-package-gdal"
  s.version      = package["nativeVersion"]
  s.summary      = "GDAL is an open source MIT licensed translator library for raster and vector geospatial data formats."
  s.homepage     = "https://github.com/OSGeo/gdal"
  s.author       = "GDAL Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'gdal.xcframework', 'expat.xcframework', 'geos.xcframework', 'geotiff.xcframework', 'iconv.xcframework', 'proj.xcframework', 'spatialite.xcframework', 'sqlite3.xcframework', 'tiff.xcframework', 'jpeg.xcframework', 'zstd.xcframework', 'Lerc.xcframework', 'webp.xcframework', 'z.xcframework'
  s.library = 'xml2'
  s.resources = ['dist/prebuilt/ios-iphoneos-mt-release/share/gdal']
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
