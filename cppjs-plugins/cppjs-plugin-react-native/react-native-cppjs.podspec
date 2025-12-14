require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
system("cd \"#{Pod::Config.instance.installation_root}/..\" && node \"#{__dir__}/script/build_js.js\" ios && node \"#{__dir__}/script/build_ios.js\"", :out => File::NULL)

Pod::Spec.new do |s|
  s.name         = "react-native-cppjs"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = "Cpp.js Authors"

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :http => "file:${PODS_ROOT}/../../.cppjs/react-native-cppjs.xcframework.zip", :type => "zip" }

  s.vendored_frameworks = 'react-native-cppjs.xcframework'

  s.script_phase = {
    :name => 'Cpp.js',
    :script => 'cd "${PODS_ROOT}/../.." && node "${PODS_TARGET_SRCROOT}/script/build_js.js" ios && node "${PODS_TARGET_SRCROOT}/script/build_ios.js"',
    :execution_position => :before_compile,
    :output_files => ['$(PODS_XCFRAMEWORKS_BUILD_DIR)/react-native-cppjs/libreact-native-cppjs.a']
  }
  s.user_target_xcconfig = { 'OTHER_LDFLAGS' => '-ObjC -force_load $(PODS_XCFRAMEWORKS_BUILD_DIR)/react-native-cppjs/libreact-native-cppjs.a' }
end
