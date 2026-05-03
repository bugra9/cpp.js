require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "tiff"
  s.name         = "cppjs-package-tiff"
  s.version      = package["nativeVersion"]
  s.summary      = "The LibTIFF software provides support for the Tag Image File Format (TIFF), a widely used format for storing image data."
  s.homepage     = "https://libtiff.gitlab.io/libtiff/index.html"
  s.author       = "Tiff Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'z.xcframework', 'jpeg.xcframework', 'zstd.xcframework', 'Lerc.xcframework', 'tiff.xcframework', 'tiffxx.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
