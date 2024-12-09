require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "sqlite3"
  s.name         = package["name"]
  s.version      = package["nativeVersion"]
  s.summary      = "SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine."
  s.homepage     = "https://www.sqlite.org"
  s.author       = "SQLite Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'z.xcframework', 'sqlite3.xcframework'
end
