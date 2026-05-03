require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "expat"
  s.name         = "cppjs-package-expat"
  s.version      = package["nativeVersion"]
  s.summary      = "Fast streaming XML parser"
  s.homepage     = "https://github.com/libexpat/libexpat"
  s.author       = "Thai Open Source Software Center Ltd, Clark Cooper, and Expat maintainers"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'expat.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
