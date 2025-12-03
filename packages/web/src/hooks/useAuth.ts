// =============================================================================
// CUSTOM REACT HOOK - useAuth
// =============================================================================
// Custom Hooks sind wiederverwendbare Logik-Einheiten in React.
// Regeln für Hooks:
// 1. Namen beginnen immer mit "use"
// 2. Dürfen nur in Komponenten oder anderen Hooks aufgerufen werden
// 3. Dürfen nicht in Schleifen, Bedingungen oder verschachtelten Funktionen sein

import { useEffect, useState } from 'react'

// Firebase User-Typ für TypeScript
import { User } from 'firebase/auth'

// Unsere Auth-Hilfsfunktionen
import { 
  onAuthChange, 
  getUserProfile, 
  UserProfile,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from '../lib/auth'

// -----------------------------------------------------------------------------
// INTERFACE FÜR HOOK-RÜCKGABE
// -----------------------------------------------------------------------------
// Wir definieren genau was dieser Hook zurückgibt.
// Das hilft bei der Autovervollständigung und Fehlervermeidung.

interface UseAuthReturn {
  user: User | null           // Firebase User-Objekt oder null
  profile: UserProfile | null // Unser eigenes Profil aus Firestore
  loading: boolean            // Wird gerade geladen?
  error: string | null        // Fehlermeldung oder null
  
  // Funktionen für Auth-Aktionen
  // Promise<void> = Asynchrone Funktion ohne Rückgabewert
  register: (email: string, password: string, displayName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

// -----------------------------------------------------------------------------
// DER CUSTOM HOOK
// -----------------------------------------------------------------------------
// Hooks sind normale Funktionen die React-Hooks verwenden

export const useAuth = (): UseAuthReturn => {
  // ---------------------------------------------------------------------------
  // useState - LOKALER STATE IN KOMPONENTEN
  // ---------------------------------------------------------------------------
  // useState gibt ein Array mit 2 Elementen zurück:
  // [aktuellerWert, setterFunktion]
  // Wir verwenden Array Destructuring um sie zu extrahieren
  
  // <User | null> ist ein GENERIC: Wir sagen TypeScript welcher Typ der State hat
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)  // TypeScript inferiert boolean
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // useEffect - SIDE EFFECTS & LIFECYCLE
  // ---------------------------------------------------------------------------
  // useEffect führt Code aus wenn:
  // - Die Komponente "mounted" wird (erscheint im DOM)
  // - Abhängigkeiten im Array sich ändern
  // - Die Komponente "unmounted" wird (Cleanup-Funktion)
  
  useEffect(() => {
    // onAuthChange ist ein Firebase Auth Observer
    // Er wird aufgerufen wenn sich der Auth-Status ändert (Login/Logout)
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // async/await: Warte auf das Ergebnis der Promise
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    // CLEANUP FUNKTION
    // Diese Funktion wird aufgerufen wenn die Komponente unmounted wird
    // Wichtig um Memory Leaks zu vermeiden!
    return () => unsubscribe()
  }, [])  // Leeres Array = nur einmal beim Mount ausführen

  // ---------------------------------------------------------------------------
  // ASYNC FUNKTIONEN MIT TRY/CATCH
  // ---------------------------------------------------------------------------
  // async/await macht asynchronen Code lesbarer
  // try/catch fängt Fehler ab
  
  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true)
    setError(null)  // Vorherige Fehler löschen
    
    try {
      await registerWithEmail(email, password, displayName)
      // Wenn hier, dann war es erfolgreich!
    } catch (err) {
      // err hat Typ 'unknown' - wir müssen prüfen was es ist
      // instanceof prüft ob err eine Instanz von Error ist
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      setError(message)
      throw err  // Fehler weitergeben für die aufrufende Komponente
    } finally {
      // finally wird IMMER ausgeführt, egal ob Erfolg oder Fehler
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login fehlgeschlagen'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google Login fehlgeschlagen'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      await signOut()
      setProfile(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout fehlgeschlagen'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // Arrow Function ohne Parameter, setzt error auf null
  const clearError = () => setError(null)

  // ---------------------------------------------------------------------------
  // RETURN - WAS DER HOOK ZURÜCKGIBT
  // ---------------------------------------------------------------------------
  // Object Shorthand: { user } ist das gleiche wie { user: user }
  return {
    user,
    profile,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
    clearError,
  }
}
