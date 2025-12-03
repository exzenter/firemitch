// =============================================================================
// ZUSTAND STORE - THEME STATE
// =============================================================================
// Dieser Store verwaltet das Theme (Light/Dark Mode).

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// -----------------------------------------------------------------------------
// STORE INTERFACE
// -----------------------------------------------------------------------------

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

// -----------------------------------------------------------------------------
// STORE ERSTELLEN
// -----------------------------------------------------------------------------
// persist middleware speichert den Theme-State im localStorage

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // === INITIALER STATE ===
      theme: 'dark', // Standard ist Dark Mode
      
      // === ACTIONS ===
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
      
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'theme-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)

