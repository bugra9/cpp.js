require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "___PROJECT_NAME___"
  s.name         = "___PROJECT_NAME___"
  s.version      = package["nativeVersion"]
  s.summary      = "___PROJECT_NAME___ package"
  s.homepage     = "https://cpp.js.org"
  s.author       = "___PROJECT_NAME___ Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = ___PROJECT_FRAMEWORKS___
  s.resources = ___PROJECT_RESOURCES___
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
