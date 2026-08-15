import { useState } from 'react';
import { initNative, Native } from './native/native.h';
import './App.css';

function App() {
  const [message, setMessage] = useState("compiling ...");

  initNative().then(async () => {
    setMessage(await Native.sample());
  });

  return (
    <div className="App">
      <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
    </div>
  );
}

export default App;
