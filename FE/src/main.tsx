import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from '@dr.pogodin/react-helmet'
import './styles/App.css'
import App from './App.tsx'

const urlParams = new URLSearchParams(window.location.search);
const jwtParamater = urlParams.get('jwt');

if (jwtParamater) {
    localStorage.setItem('authToken', jwtParamater)
    urlParams.delete("jwt")
    
    if (history.replaceState) {
        let newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + window.location.hash;
        history.replaceState(null, '', newUrl);
    }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)
