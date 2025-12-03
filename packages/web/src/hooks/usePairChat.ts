import { useEffect, useState, useCallback, useRef } from 'react'
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

// Interface für PairChat Daten in Firestore
export interface PairChatData {
  pairId: string // sortierte UIDs
  text: string
  lastUpdated: ReturnType<typeof serverTimestamp>
  players: [string, string] // beide Spieler-UIDs
}

interface UsePairChatResult {
  text: string
  loading: boolean
  error: string | null
  updateText: (newText: string) => Promise<void>
}

export const usePairChat = (
  pairId: string | null,
  currentUid: string | undefined
): UsePairChatResult => {
  const [text, setText] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isUpdatingRef = useRef(false)

  // Real-time Listener für Firestore Updates
  useEffect(() => {
    if (!pairId || !currentUid) {
      setLoading(false)
      return
    }

    const chatRef = doc(db, 'pairChats', pairId)

    const unsubscribe = onSnapshot(
      chatRef,
      (snapshot) => {
        // Ignoriere Updates die wir selbst ausgelöst haben
        if (isUpdatingRef.current) {
          isUpdatingRef.current = false
          return
        }

        if (snapshot.exists()) {
          const data = snapshot.data() as PairChatData
          setText(data.text || '')
        } else {
          // Dokument existiert noch nicht, initialisiere es
          setText('')
        }
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [pairId, currentUid])

  // Funktion zum Aktualisieren des Textes
  const updateText = useCallback(
    async (newText: string) => {
      if (!pairId || !currentUid) return

      // Zeichenlimit prüfen
      if (newText.length > 5000) {
        setError('Text zu lang (max. 5000 Zeichen)')
        return
      }

      // Optimistic Update
      setText(newText)
      isUpdatingRef.current = true

      try {
        const chatRef = doc(db, 'pairChats', pairId)
        const chatSnap = await getDoc(chatRef)

        if (chatSnap.exists()) {
          // Dokument existiert, aktualisiere es
          await updateDoc(chatRef, {
            text: newText,
            lastUpdated: serverTimestamp(),
          })
        } else {
          // Dokument existiert nicht, erstelle es
          // Paar-ID aus pairId extrahieren (ist bereits sortiert)
          const playerIds = pairId.split('_') as [string, string]
          await setDoc(chatRef, {
            pairId,
            text: newText,
            players: playerIds,
            lastUpdated: serverTimestamp(),
          })
        }
        setError(null)
      } catch (err) {
        console.error('Failed to update chat text:', err)
        setError('Fehler beim Speichern')
        // Revert optimistic update bei Fehler
        const chatRef = doc(db, 'pairChats', pairId)
        const chatSnap = await getDoc(chatRef)
        if (chatSnap.exists()) {
          const data = chatSnap.data() as PairChatData
          setText(data.text || '')
        }
      }
    },
    [pairId, currentUid]
  )

  return {
    text,
    loading,
    error,
    updateText,
  }
}

