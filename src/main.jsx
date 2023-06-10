import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App_r.jsx'
// import './index.css'
import './App-canonical.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <>
//   <div id="dummy" className="placeholder deferred"></div>
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
//   </>
// )

// this is because the load is terrible looking but it doesn't change much.
document.addEventListener("DOMContentLoaded", function(event) {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <>
    <div id="dummy" className="placeholder deferred"></div>
    <React.StrictMode>
      <App />
    </React.StrictMode>
    </>
  );
});