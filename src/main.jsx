import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App_r.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
  <React.StrictMode>
    <App />
  </React.StrictMode>
  <div id="dummy" className="placeholder" ></div>
  <div id="ez-text"></div>
  </>,
)
