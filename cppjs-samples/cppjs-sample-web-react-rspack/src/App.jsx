import { useState } from 'react';
import { init } from 'cpp.js';
import { Native } from './native/native.h';
import './App.css';

function App() {
  const [message, setMessage] = useState("compiling ...");

  init().then(async () => {
    setMessage(await Native.sample());
  });

  return (
    <div className="App">
      <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
    </div>
  );
}

export default App;
