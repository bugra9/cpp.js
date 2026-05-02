import { useState } from 'react';
import { initCppJs, Native } from './native/native.h';
import './App.css';

function App() {
  const [message, setMessage] = useState("compiling ...");

  initCppJs().then(async () => {
    setMessage(await Native.sample());
  });

  return (
    <div className="App">
      <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
    </div>
  );
}

export default App;
