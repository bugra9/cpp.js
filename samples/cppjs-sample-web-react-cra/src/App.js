import React, { useState } from 'react';
import Native from './native/native.h';
import logo from './logo.svg';
import './App.css';

function App() {
    const [message, setMessage] = useState("Loading...");

    Native().then(({Native}) => {;
        setMessage(Native.sample());
    });

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    {message}
                </p>
            </header>
        </div>
    );
}

export default App;
