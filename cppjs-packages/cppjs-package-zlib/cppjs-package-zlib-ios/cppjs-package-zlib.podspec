require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "z"
  s.name         = "cppjs-package-zlib"
  s.version      = package["nativeVersion"]
  s.summary      = "A Massively Spiffy Yet Delicately Unobtrusive Compression Library"
  s.homepage     = "https://www.zlib.net/"
  s.author       = "ZLIB Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'z.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
