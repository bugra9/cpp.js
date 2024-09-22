require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "MatrixMultiplier"
  s.name         = package["name"]
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.author       = "Buğra SARI"
  s.source       = { :http => "https://cpp.js.org" }

  s.vendored_frameworks = 'cppjs-sample-lib-prebuilt-matrix.xcframework'
end