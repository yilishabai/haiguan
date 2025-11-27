import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { getDatabase } from './lib/sqlite'
import { startCollaborationEngine, startConsistencyScheduler } from './lib/collaboration'

getDatabase()
startCollaborationEngine()
startConsistencyScheduler()
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
