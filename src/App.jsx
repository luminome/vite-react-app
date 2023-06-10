import React, { Component, useRef, useState, useEffect, useCallback } from "react";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);


  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>{!data ? "Loading..." : data}</p>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR hello now what.
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more and blazing-fast.
      </p>
    </>
  )
}

export default App