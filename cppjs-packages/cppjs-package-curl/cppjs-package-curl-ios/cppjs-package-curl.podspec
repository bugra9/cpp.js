require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "curl"
  s.name         = "cppjs-package-curl"
  s.version      = package["nativeVersion"]
  s.summary      = "Transferring data with URLs"
  s.homepage     = "https://curl.se/"
  s.author       = "CURL Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'curl.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
