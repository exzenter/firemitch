import { useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { 
  onAuthChange, 
  getUserProfile, 
  UserProfile,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
} from '../lib/auth'

interface UseAuthReturn {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  register: (email: string, password: string, displayName: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const register = async (email: string, password: string, displayName: string) => {
    setLoading(true)
    setError(null)
    try {
      await registerWithEmail(email, password, displayName)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registrierung fehlgeschlagen'
      setError(message)
      throw err
    } finally {
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

  const clearError = () => setError(null)

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

