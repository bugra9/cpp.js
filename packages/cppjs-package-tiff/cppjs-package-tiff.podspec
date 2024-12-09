require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "tiff"
  s.name         = package["name"]
  s.version      = package["nativeVersion"]
  s.summary      = "The LibTIFF software provides support for the Tag Image File Format (TIFF), a widely used format for storing image data."
  s.homepage     = "https://libtiff.gitlab.io/libtiff/index.html"
  s.author       = "Tiff Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'z.xcframework', 'tiff.xcframework', 'tiffxx.xcframework'
end
