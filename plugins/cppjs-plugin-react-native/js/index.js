// import { NativeModules, Platform } from 'react-native';
import z from 'cppjs-core-rn-embind';

/* const { RNJsiLib } = NativeModules;
if (RNJsiLib && RNJsiLib.start) {
    RNJsiLib.start();

    let platform = null;
    if (Platform.OS === 'ios') platform = 'iOS-iphoneos';
    else if (Platform.OS === 'android') platform = 'Android-arm64-v8a';

    // const cppjs = new CppJS(platform);
    // const env = cppjs.getData('env');
    // console.log('env', env);
} else {
    console.error('Module failed to initialise.');
} */

export default z;
