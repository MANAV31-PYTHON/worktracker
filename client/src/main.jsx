import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode is disabled intentionally — it double-invokes effects in dev
// which causes socket.io's connect/register sequence to misfire
createRoot(document.getElementById('root')).render(<App />)
