require "json"
package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.module_name  = "openssl"
  s.name         = "cppjs-package-openssl"
  s.version      = package["nativeVersion"]
  s.summary      = "TLS/SSL and crypto library"
  s.homepage     = "https://www.openssl.org/"
  s.author       = "OpenSSL Authors"
  s.source       = { :http => "https://cpp.js.org" }
  s.vendored_frameworks = 'ssl.xcframework', 'crypto.xcframework'
  s.resources = ['dist/prebuilt/ios-iphoneos/ssl/certs']
  # arm64-only iOS simulator slice; drop x86_64 to avoid linker errors on consumer apps.
  s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'x86_64' }
end
