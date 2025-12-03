import { useEffect, useState, useCallback } from 'react'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createEmptyBoard } from '../types/game'

interface MatchmakingEntry {
  odg: string
  playerName: string
  status: 'waiting' | 'matched'
  gameId?: string
  joinedAt: Timestamp
}

interface UseMatchmakingResult {
  isSearching: boolean
  gameId: string | null
  error: string | null
  joinQueue: () => Promise<void>
  leaveQueue: () => Promise<void>
}

export const useMatchmaking = (
  currentUid: string | undefined,
  playerName: string | undefined
): UseMatchmakingResult => {
  const [isSearching, setIsSearching] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUid || !isSearching) return

    const entryRef = doc(db, 'matchmaking', currentUid)
    
    const unsubscribe = onSnapshot(entryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MatchmakingEntry
        if (data.status === 'matched' && data.gameId) {
          setGameId(data.gameId)
          setIsSearching(false)
          deleteDoc(entryRef).catch(console.error)
        }
      }
    })

    return () => unsubscribe()
  }, [currentUid, isSearching])

  useEffect(() => {
    if (!currentUid || !isSearching || !playerName) return

    const matchmakingRef = collection(db, 'matchmaking')
    const q = query(
      matchmakingRef,
      where('status', '==', 'waiting'),
      orderBy('joinedAt', 'asc'),
      limit(2)
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const waitingPlayers = snapshot.docs
        .map((d) => ({ odg: d.id, ...d.data() } as MatchmakingEntry & { odg: string }))
        .filter((p) => p.odg !== currentUid)

      if (waitingPlayers.length > 0) {
        const opponent = waitingPlayers[0]
        
        try {
          await runTransaction(db, async (transaction) => {
            const myEntryRef = doc(db, 'matchmaking', currentUid)
            const opponentEntryRef = doc(db, 'matchmaking', opponent.odg)
            
            const myEntry = await transaction.get(myEntryRef)
            const opponentEntry = await transaction.get(opponentEntryRef)
            
            if (!myEntry.exists() || !opponentEntry.exists()) return
            if (myEntry.data()?.status !== 'waiting') return
            if (opponentEntry.data()?.status !== 'waiting') return
            
            const iAmRed = Math.random() < 0.5
            const redPlayer = iAmRed ? currentUid : opponent.odg
            const yellowPlayer = iAmRed ? opponent.odg : currentUid
            const redName = iAmRed ? playerName : opponent.playerName
            const yellowName = iAmRed ? opponent.playerName : playerName
            
            const gamesRef = collection(db, 'games')
            const newGameRef = doc(gamesRef)
            
            transaction.set(newGameRef, {
              players: { red: redPlayer, yellow: yellowPlayer },
              playerNames: { red: redName, yellow: yellowName },
              board: createEmptyBoard(),
              currentPlayer: 'red',
              status: 'playing',
              winner: null,
              winningCells: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
            
            transaction.update(myEntryRef, { status: 'matched', gameId: newGameRef.id })
            transaction.update(opponentEntryRef, { status: 'matched', gameId: newGameRef.id })
          })
        } catch (err) {
          console.log('Match creation failed, retrying...', err)
        }
      }
    })

    return () => unsubscribe()
  }, [currentUid, playerName, isSearching])

  const joinQueue = useCallback(async () => {
    if (!currentUid || !playerName) {
      setError('Nicht angemeldet')
      return
    }

    setError(null)
    setGameId(null)

    try {
      const entryRef = doc(db, 'matchmaking', currentUid)
      await setDoc(entryRef, {
        odg: currentUid,
        playerName,
        status: 'waiting',
        joinedAt: serverTimestamp(),
      })
      setIsSearching(true)
    } catch (err) {
      setError('Fehler beim Beitreten der Warteschlange')
      console.error(err)
    }
  }, [currentUid, playerName])

  const leaveQueue = useCallback(async () => {
    if (!currentUid) return

    try {
      const entryRef = doc(db, 'matchmaking', currentUid)
      await deleteDoc(entryRef)
    } catch (err) {
      console.error('Error leaving queue:', err)
    } finally {
      setIsSearching(false)
    }
  }, [currentUid])

  return {
    isSearching,
    gameId,
    error,
    joinQueue,
    leaveQueue,
  }
}
