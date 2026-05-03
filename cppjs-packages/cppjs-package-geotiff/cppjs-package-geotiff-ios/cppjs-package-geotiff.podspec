require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "geotiff"
  s.name         = "cppjs-package-geotiff"
  s.version      = package["nativeVersion"]
  s.summary      = "This library is designed to permit the extraction and parsing of the 'GeoTIFF' Key directories, as well as definition and installation of GeoTIFF keys in new files."
  s.homepage     = "https://github.com/OSGeo/libgeotiff"
  s.author       = "GeoTiff Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'geotiff.xcframework', 'proj.xcframework', 'tiff.xcframework', 'jpeg.xcframework', 'z.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
