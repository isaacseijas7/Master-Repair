import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'driver.js/dist/driver.css'
import './styles/tour.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
