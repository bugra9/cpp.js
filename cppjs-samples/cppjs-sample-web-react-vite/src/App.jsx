import { useState, useEffect } from 'react'
import './App.css'
import { init } from 'cpp.js'
import { Native } from './native/native.h'

function App() {
  const [message, setMessage] = useState('compiling ...')

  useEffect(() => {
    init().then(async () => {
      setMessage(await Native.sample());
    });
  }, []);

  return (
    <>
      <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
    </>
  )
}

export default App
