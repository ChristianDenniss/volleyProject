import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from '@dr.pogodin/react-helmet'
import './styles/tokens.css'
import './styles/App.css'
import App from './App.tsx'
import { enableMocking } from './mocks'

async function bootstrap() {
  await enableMocking()

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </React.StrictMode>,
  )
}

bootstrap()
