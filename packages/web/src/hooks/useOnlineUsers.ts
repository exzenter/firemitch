// =============================================================================
// HOOK FÜR ONLINE USER TRACKING
// =============================================================================
// Dieser Hook trackt alle aktuell eingeloggten Benutzer in Echtzeit.

import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { User } from 'firebase/auth'
import { UserProfile } from '../lib/auth'

// -----------------------------------------------------------------------------
// INTERFACE FÜR ONLINE USER
// -----------------------------------------------------------------------------

interface OnlineUser {
  uid: string
  displayName: string
  lastSeen: Date
}

interface UseOnlineUsersReturn {
  onlineUsers: OnlineUser[]
  onlineCount: number
  loading: boolean
}

// -----------------------------------------------------------------------------
// PRESENCE TRACKING
// -----------------------------------------------------------------------------
// Setzt den Online-Status eines Users in Firestore

export const setUserOnline = async (user: User, profile: UserProfile | null): Promise<void> => {
  if (!user || !profile) return
  
  try {
    const presenceRef = doc(db, 'presence', user.uid)
    
    await setDoc(
      presenceRef,
      {
        uid: user.uid,
        displayName: profile.displayName,
        lastSeen: serverTimestamp(),
      },
      { merge: true }
    )
    console.log('User online gesetzt:', profile.displayName)
  } catch (error) {
    console.error('Fehler beim Setzen des Online-Status:', error)
  }
}

// Entfernt den Online-Status eines Users
export const setUserOffline = async (uid: string): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', uid)
    await deleteDoc(presenceRef)
    console.log('User offline gesetzt:', uid)
  } catch (error) {
    console.error('Fehler beim Entfernen des Online-Status:', error)
  }
}

// -----------------------------------------------------------------------------
// HOOK
// -----------------------------------------------------------------------------

export const useOnlineUsers = (): UseOnlineUsersReturn => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Direkte Collection-Referenz für alle Online-User
    const presenceRef = collection(db, 'presence')

    // Echtzeit-Listener für Änderungen
    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        const users: OnlineUser[] = []
        
        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data()
          // Nutze die Document-ID als uid falls nicht vorhanden
          const uid = data.uid || docSnapshot.id
          users.push({
            uid: uid,
            displayName: data.displayName || 'Unbekannt',
            lastSeen: data.lastSeen?.toDate() || new Date(),
          })
        })
        
        // Sortiere nach displayName
        users.sort((a, b) => a.displayName.localeCompare(b.displayName))
        
        console.log('Online Users aktualisiert:', users.length, users.map(u => u.displayName))
        
        setOnlineUsers(users)
        setLoading(false)
      },
      (error) => {
        console.error('Fehler beim Laden der Online-User:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    loading,
  }
}

