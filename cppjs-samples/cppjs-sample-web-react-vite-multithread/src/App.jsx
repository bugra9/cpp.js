import { useState, useEffect } from 'react'
import './App.css'
import { initCppJs, Native } from './native/native.h'

function App() {
  const [standardResult, setStandardResult] = useState('compiling ...')
  const [threadResult, setThreadResult] = useState('...')

  useEffect(() => {
    initCppJs().then(() => {
        setStandardResult(Native.sample());
        
        // Run computation on a separate thread
        Native.runOnThread();
        
        // Poll for thread result after a short delay
        setTimeout(() => {
            setThreadResult(Native.getThreadResult());
        }, 1000);
    });
  }, []);

  return (
    <>
      <p>Matrix multiplier with c++</p>
      <br />
      <p>Standard Result &nbsp;&nbsp;:&nbsp;&nbsp; {standardResult}</p>
      <br />
      <p>Thread result &nbsp;&nbsp;:&nbsp;&nbsp; {threadResult}</p>
    </>
  )
}

export default App
