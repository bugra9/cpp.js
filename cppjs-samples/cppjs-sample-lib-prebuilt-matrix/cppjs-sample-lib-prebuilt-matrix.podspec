require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "MatrixMultiplier"
  s.name         = "cppjs-sample-lib-prebuilt-matrix"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.author       = "Cpp.js Authors"
  s.source       = { :http => "https://cpp.js.org" }

  s.vendored_frameworks = 'cppjs-sample-lib-prebuilt-matrix.xcframework'
  # arm64-only iOS simulator slice; drop x86_64 on both pod and consumer targets.
  # pod_target_xcconfig is required so CocoaPods' [CP] Copy XCFrameworks slice selector
  # (which reads $ARCHS in the pod target's context) matches ios-arm64-simulator instead
  # of silently warning and skipping the copy, which would leave the .a missing at link time.
  s.pod_target_xcconfig  = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
