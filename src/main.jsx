import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { configurationError } from '@/lib/supabaseClient'

ReactDOM.createRoot(document.getElementById('root')).render(
  configurationError ? <main className="p-8 text-center" role="alert"><h1>SmartBridge is temporarily unavailable</h1><p>{configurationError}</p></main> : <App />
)
