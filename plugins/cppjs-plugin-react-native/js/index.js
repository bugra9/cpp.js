import { NativeModules } from 'react-native';
import z from 'cppjs-core-rn-embind';

const { RNJsiLib } = NativeModules;
RNJsiLib.start();

export default z;
