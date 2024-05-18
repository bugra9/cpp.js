require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "spatialite"
  s.name         = package["name"]
  s.version      = package["nativeVersion"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.author       = "Spatialite Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'spatialite.xcframework', 'geos.xcframework', 'iconv.xcframework', 'proj.xcframework', 'sqlite3.xcframework', 'z.xcframework'
end
