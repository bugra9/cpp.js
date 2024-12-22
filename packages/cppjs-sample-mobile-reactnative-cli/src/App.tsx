/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, View} from 'react-native';

import { initCppJs, Native } from './native/native.h';

function App(): React.JSX.Element {
  const [message, setMessage] = useState('compiling ...');

  useEffect(() => {
    initCppJs().then(() => {
        setMessage(Native.sample());
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <Text style={styles.text}>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#242424'
    },
    text: {
      color: '#FFFFFF',
      fontWeight: 'bold',
      fontSize: 30,
    },
  });

export default App;
