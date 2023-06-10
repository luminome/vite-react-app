import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App_r.jsx'
// import './index.css'
// import './App_r.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <>
//   <div id="dummy" className="placeholder deferred"></div>
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
//   </>
// )

// this is because the load was terrible looking.
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