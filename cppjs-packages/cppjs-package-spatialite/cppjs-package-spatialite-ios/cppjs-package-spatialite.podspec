require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "spatialite"
  s.name         = "cppjs-package-spatialite"
  s.version      = package["nativeVersion"]
  s.summary      = "SpatiaLite is an open source library intended to extend the SQLite core to support fully fledged Spatial SQL capabilities."
  s.homepage     = "https://www.gaia-gis.it/fossil/libspatialite/index"
  s.author       = "Spatialite Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'spatialite.xcframework', 'geos.xcframework', 'iconv.xcframework', 'proj.xcframework', 'sqlite3.xcframework', 'z.xcframework'
end
