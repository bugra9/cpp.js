require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "webp"
  s.name         = "cppjs-package-webp"
  s.version      = package["nativeVersion"]
  s.summary      = "WebP codec is a library to encode and decode images in WebP format."
  s.homepage     = "https://developers.google.com/speed/webp"
  s.author       = "Webp Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'webp.xcframework', 'sharpyuv.xcframework'
end
