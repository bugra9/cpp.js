require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-cppjs"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :http => "file:${PODS_ROOT}/../../.cppjs/react-native-cppjs.xcframework.zip", :type => "zip" }

  s.vendored_frameworks = 'react-native-cppjs.xcframework'

  s.script_phase = {
    :name => 'Cpp.js',
    :script => '${PODS_TARGET_SRCROOT}/script/build_ios.sh',
    :execution_position => :before_compile
  }
end
