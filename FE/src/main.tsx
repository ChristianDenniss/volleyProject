import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
