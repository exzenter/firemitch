// =============================================================================
// ZUSTAND STORE - AUTH STATE
// =============================================================================
// Dieser Store verwaltet den globalen Authentifizierungs-State.
// Er wird zusätzlich zum useAuth Hook verwendet, um Auth-Daten
// in Komponenten verfügbar zu machen, die nicht direkt den Hook nutzen.
//
// WARUM ZWEI AUTH-LÖSUNGEN?
// - useAuth Hook: Für Komponenten die Auth-Aktionen brauchen (login, logout)
// - authStore: Für schnellen Zugriff auf Auth-State ohne Hook-Overhead

import { create } from 'zustand'

// Firebase User Typ
import { User } from 'firebase/auth'

// Unser UserProfile Interface aus der auth.ts
import { UserProfile } from '../lib/auth'

// -----------------------------------------------------------------------------
// STORE INTERFACE
// -----------------------------------------------------------------------------
// Definiert die Struktur des Auth-Stores

interface AuthStore {
  // === STATE ===
  user: User | null           // Firebase User-Objekt (null wenn nicht eingeloggt)
  profile: UserProfile | null // Unser eigenes Profil aus Firestore
  loading: boolean            // Wird Auth-Status noch geladen?
  
  // === ACTIONS (Setter-Funktionen) ===
  // Diese sind einfache Setter, keine komplexe Logik
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
}

// -----------------------------------------------------------------------------
// STORE ERSTELLEN
// -----------------------------------------------------------------------------
// create<AuthStore> ist ein Generic - wir sagen Zustand welchen Typ der Store hat

export const useAuthStore = create<AuthStore>((set) => ({
  // === INITIALER STATE ===
  user: null,
  profile: null,
  loading: true,  // Startet als true weil wir Auth-Status erst laden müssen
  
  // === ACTIONS ===
  // set() aktualisiert den State
  // Kurzform: set({ user }) ist das gleiche wie set({ user: user })
  
  setUser: (user) => set({ user }),
  
  setProfile: (profile) => set({ profile }),
  
  setLoading: (loading) => set({ loading }),
}))

// -----------------------------------------------------------------------------
// VERWENDUNG IN KOMPONENTEN
// -----------------------------------------------------------------------------
// 
// // Alles aus dem Store holen:
// const { user, profile, loading, setUser } = useAuthStore()
// 
// // Nur bestimmte Werte (optimiert für Performance):
// const user = useAuthStore((state) => state.user)
// 
// // Mit Selector-Funktion:
// const isLoggedIn = useAuthStore((state) => state.user !== null)
