require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "zstd"
  s.name         = "cppjs-package-zstd"
  s.version      = package["nativeVersion"]
  s.summary      = "Zstandard - Fast real-time compression algorithm."
  s.homepage     = "https://github.com/facebook/zstd"
  s.author       = "zstd Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'zstd.xcframework'
  s.resources = []
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
