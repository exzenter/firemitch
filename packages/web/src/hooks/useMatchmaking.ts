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
import { createEmptyBoardFlat } from '../types/game'

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

  // Listen for status changes on own entry (for when opponent creates match)
  useEffect(() => {
    if (!currentUid || !isSearching) return

    const entryRef = doc(db, 'matchmaking', currentUid)
    
    const unsubscribe = onSnapshot(entryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as MatchmakingEntry
        if (data.status === 'matched' && data.gameId) {
          console.log('Match found! Game ID:', data.gameId)
          setGameId(data.gameId)
          setIsSearching(false)
          // Clean up matchmaking entry
          deleteDoc(entryRef).catch(console.error)
        }
      }
    })

    return () => unsubscribe()
  }, [currentUid, isSearching])

  // Listen for waiting players and create match if I'm the oldest
  useEffect(() => {
    if (!currentUid || !isSearching || !playerName) return

    const matchmakingRef = collection(db, 'matchmaking')
    const q = query(
      matchmakingRef,
      where('status', '==', 'waiting'),
      orderBy('joinedAt', 'asc'),
      limit(10) // Get more to ensure we find a match
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const waitingPlayers = snapshot.docs.map((d) => ({ 
        odg: d.id, 
        ...d.data() 
      } as MatchmakingEntry & { odg: string }))

      console.log('Waiting players:', waitingPlayers.map(p => p.playerName))

      // Need at least 2 players
      if (waitingPlayers.length < 2) {
        console.log('Not enough players yet')
        return
      }

      // Only the OLDEST player (first in sorted list) should create the match
      // This prevents race conditions
      const amIOldest = waitingPlayers[0].odg === currentUid
      
      if (!amIOldest) {
        console.log('Waiting for oldest player to create match...')
        return
      }

      // I'm the oldest, find my opponent (second oldest)
      const opponent = waitingPlayers[1]
      console.log('I am oldest, creating match with:', opponent.playerName)

      try {
        await runTransaction(db, async (transaction) => {
          const myEntryRef = doc(db, 'matchmaking', currentUid)
          const opponentEntryRef = doc(db, 'matchmaking', opponent.odg)
          
          const myEntry = await transaction.get(myEntryRef)
          const opponentEntry = await transaction.get(opponentEntryRef)
          
          // Verify both are still waiting
          if (!myEntry.exists() || !opponentEntry.exists()) {
            console.log('One entry no longer exists')
            return
          }
          if (myEntry.data()?.status !== 'waiting') {
            console.log('My entry is no longer waiting')
            return
          }
          if (opponentEntry.data()?.status !== 'waiting') {
            console.log('Opponent entry is no longer waiting')
            return
          }
          
          // Randomly assign colors
          const iAmRed = Math.random() < 0.5
          const redPlayer = iAmRed ? currentUid : opponent.odg
          const yellowPlayer = iAmRed ? opponent.odg : currentUid
          const redName = iAmRed ? playerName : opponent.playerName
          const yellowName = iAmRed ? opponent.playerName : playerName
          
          // Create game
          const gamesRef = collection(db, 'games')
          const newGameRef = doc(gamesRef)
          
          console.log('Creating game:', newGameRef.id)
          
          transaction.set(newGameRef, {
            players: { red: redPlayer, yellow: yellowPlayer },
            playerNames: { red: redName, yellow: yellowName },
            board: createEmptyBoardFlat(),
            currentPlayer: 'red',
            status: 'playing',
            winner: null,
            winningCells: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          
          // Update both matchmaking entries to matched
          transaction.update(myEntryRef, { status: 'matched', gameId: newGameRef.id })
          transaction.update(opponentEntryRef, { status: 'matched', gameId: newGameRef.id })
        })
        
        console.log('Match created successfully!')
      } catch (err) {
        console.error('Match creation failed:', err)
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
      console.log('Joined queue as:', playerName)
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
      console.log('Left queue')
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
