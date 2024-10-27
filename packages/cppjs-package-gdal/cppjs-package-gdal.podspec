require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "gdal"
  s.name         = package["name"]
  s.version      = package["nativeVersion"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.author       = "GDAL Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'gdal.xcframework', 'expat.xcframework', 'geos.xcframework', 'geotiff.xcframework', 'iconv.xcframework', 'proj.xcframework', 'spatialite.xcframework', 'sqlite3.xcframework', 'tiff.xcframework', 'webp.xcframework', 'z.xcframework'
  s.library = 'xml2'
  s.resources = ['dist/prebuilt/iOS-iphoneos/share/gdal']
end
