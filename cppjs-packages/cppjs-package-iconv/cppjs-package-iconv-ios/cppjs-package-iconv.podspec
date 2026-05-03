require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "iconv"
  s.name         = "cppjs-package-iconv"
  s.version      = package["nativeVersion"]
  s.summary      = "Iconv can convert from any of these encodings to any other, through Unicode conversion."
  s.homepage     = "https://www.gnu.org/software/libiconv/"
  s.author       = "Iconv Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'iconv.xcframework', 'charset.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
