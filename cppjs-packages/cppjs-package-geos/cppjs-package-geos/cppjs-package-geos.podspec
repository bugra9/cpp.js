require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "geos"
  s.name         = "cppjs-package-geos"
  s.version      = package["nativeVersion"]
  s.summary      = "GEOS is a C++ library for performing operations on two-dimensional vector geometries."
  s.homepage     = "https://github.com/libgeos/geos"
  s.author       = "GEOS Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'geos.xcframework', 'geos_c.xcframework'
end
