import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App_r.jsx'
import './index.css'
import './App_r.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
  <React.StrictMode>
    <App />
  </React.StrictMode>
  <div>
    <div id="dummy" className="placeholder deferred"></div>
    <div id="ez-text" className="deferred"></div>
  </div>
  </>
)
