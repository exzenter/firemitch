// =============================================================================
// REACT ENTRY POINT - HAUPTEINSTIEGSPUNKT DER APP
// =============================================================================
// Diese Datei ist der Startpunkt der React-Anwendung.
// Hier wird React initialisiert und die App in den DOM "gemountet".

// -----------------------------------------------------------------------------
// IMPORTS
// -----------------------------------------------------------------------------
// React verwendet ES6 Module-Syntax: import { xyz } from 'package'

import React from 'react'           // React-Kernbibliothek
import ReactDOM from 'react-dom/client'  // React DOM-Renderer für Browser

// TanStack Query (früher React Query) - Server State Management
// Verwaltet das Laden, Cachen und Synchronisieren von Server-Daten
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Unsere Haupt-App-Komponente
import App from './App'

// Theme Provider
import { ThemeProvider } from './components/ThemeProvider'

// Globale CSS-Styles
import './index.css'

// -----------------------------------------------------------------------------
// QUERY CLIENT KONFIGURATION
// -----------------------------------------------------------------------------
// QueryClient ist die zentrale Instanz für TanStack Query.
// Er speichert den Cache und verwaltet alle Queries.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // Daten gelten 5 Minuten als "frisch"
      retry: 1,                   // Bei Fehler nur 1x wiederholen
    },
  },
})

// -----------------------------------------------------------------------------
// REACT DOM RENDERING
// -----------------------------------------------------------------------------
// React 18 verwendet createRoot() statt dem alten ReactDOM.render()

// document.getElementById('root')! - Das '!' ist TypeScript's "Non-null Assertion"
// Es sagt: "Ich weiß, dass dieses Element existiert, vertrau mir"
ReactDOM.createRoot(document.getElementById('root')!).render(
  // -----------------------------------------------------------------------------
  // REACT.STRICTMODE
  // -----------------------------------------------------------------------------
  // StrictMode ist ein Entwicklungs-Tool, das:
  // - Vor unsicheren Lifecycle-Methoden warnt
  // - Komponenten doppelt rendert (nur in Dev) um Probleme zu finden
  // - In Production hat es keinen Effekt
  <React.StrictMode>
    
    {/* QueryClientProvider macht den QueryClient für alle Kind-Komponenten verfügbar */}
    {/* Das ist das "Provider Pattern" - ein React Context unter der Haube */}
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {/* Die eigentliche App-Komponente */}
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
