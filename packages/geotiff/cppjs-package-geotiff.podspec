require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "geotiff"
  s.name         = package["name"]
  s.version      = package["nativeVersion"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.author       = "GeoTiff Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'geotiff.xcframework', 'proj.xcframework', 'tiff.xcframework', 'z.xcframework'
end
