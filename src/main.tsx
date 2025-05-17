
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { EOSAuthProvider } from './modules/auth/context/EOSAuthContext';
import { initializeEOSSDK } from './lib/eos';

// Initialize Epic Online Services SDK
initializeEOSSDK();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <EOSAuthProvider>
        <App />
      </EOSAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
