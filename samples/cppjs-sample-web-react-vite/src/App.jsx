import { useState, useEffect } from 'react'
import './App.css'
import { initCppJs } from './native/native.h'

function App() {
  const [message, setMessage] = useState('compiling ...')

  useEffect(() => {
    initCppJs().then(({Native}) => {
        setMessage(Native.sample());
    });
  }, []);

  return (
    <>
      <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
    </>
  )
}

export default App
