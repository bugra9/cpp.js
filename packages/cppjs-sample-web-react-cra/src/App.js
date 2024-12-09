import React, { useState } from 'react';
import { initCppJs, Native } from './native/native.h';
import logo from './logo.svg';
import './App.css';

function App() {
    const [message, setMessage] = useState("compiling ...");

    initCppJs().then(() => {;
        setMessage(Native.sample());
    });

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>Matrix multiplier with c++ &nbsp;&nbsp;=&gt;&nbsp;&nbsp; {message}</p>
            </header>
        </div>
    );
}

export default App;
