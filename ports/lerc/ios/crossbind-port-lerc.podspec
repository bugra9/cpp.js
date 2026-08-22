require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "Lerc"
  s.name         = "crossbind-port-lerc"
  s.version      = package["nativeVersion"]
  s.summary      = "LERC - Limited Error Raster Compression: a fast, lossy compression scheme for raster data."
  s.homepage     = "https://github.com/Esri/lerc"
  s.author       = "Esri"
  s.source       = { :http => "https://crossbind.dev" }
  s.vendored_frameworks = 'Lerc.xcframework'
  s.resources = []
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
