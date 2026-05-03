require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "proj"
  s.name         = "cppjs-package-proj"
  s.version      = package["nativeVersion"]
  s.summary      = "PROJ is a generic coordinate transformation software that transforms geospatial coordinates from one coordinate reference system (CRS) to another."
  s.homepage     = "https://proj.org/"
  s.author       = "Proj Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'proj.xcframework', 'sqlite3.xcframework', 'tiff.xcframework'
  s.resources = ['dist/prebuilt/ios-iphoneos/share/proj']
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
