require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "z"
  s.name         = package["name"]
  s.version      = package["nativeVersion"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.author       = "ZLIB Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'z.xcframework'
end
