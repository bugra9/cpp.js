/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initCppJs, Native } from './native/native.h';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [message, setMessage] = useState('compiling ...');

  useEffect(() => {
    initCppJs().then(() => {
      console.log('a');
      console.log(Native.getSqliteVersion);
      setMessage(`${Native.sample()} - ${Native.getSqliteVersion()}`);
      console.log('b');
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</Text>
    </View>
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
