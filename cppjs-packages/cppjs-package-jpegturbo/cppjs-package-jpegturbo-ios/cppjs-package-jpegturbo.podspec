require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "jpeg"
  s.name         = "cppjs-package-jpegturbo"
  s.version      = package["nativeVersion"]
  s.summary      = "libjpeg-turbo is a JPEG image codec that uses SIMD instructions to accelerate baseline and progressive JPEG compression and decompression on systems with common CPU architectures."
  s.homepage     = "https://github.com/libjpeg-turbo/libjpeg-turbo"
  s.author       = "libjpeg-turbo Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'jpeg.xcframework'
  s.resources = []
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
