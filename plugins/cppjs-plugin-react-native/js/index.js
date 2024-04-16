import { NativeModules } from 'react-native';
import z from 'cppjs-core-rn-embind';

const { RNJsiLib, Cppjs } = NativeModules;
console.log(RNJsiLib, '-', Cppjs);
if (RNJsiLib && RNJsiLib.start) {
    RNJsiLib.start();
} else {
    console.error('Module failed to initialise.');
}

export default z;
