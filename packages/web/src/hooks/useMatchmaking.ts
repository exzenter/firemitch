// =============================================================================
// CUSTOM HOOK - useMatchmaking
// =============================================================================
// Dieser Hook verwaltet die Matchmaking-Logik für Online-Spiele.
// Er verbindet Spieler automatisch wenn zwei verfügbar sind.
//
// KONZEPT: Firestore als "Warteschlange"
// - Spieler fügt sich zur 'matchmaking' Collection hinzu
// - Alle Spieler "lauschen" auf die Collection
// - Der älteste Spieler erstellt das Spiel wenn ein zweiter kommt

import { useEffect, useState, useCallback } from 'react'

// FIRESTORE FUNKTIONEN
import {
  collection,      // Referenz zu einer Collection
  doc,             // Referenz zu einem Dokument
  setDoc,          // Dokument schreiben
  deleteDoc,       // Dokument löschen
  onSnapshot,      // Echtzeit-Listener
  query,           // Firestore Query erstellen
  where,           // Filter für Query
  orderBy,         // Sortierung für Query
  limit,           // Limitiert Anzahl Ergebnisse
  serverTimestamp, // Server-Zeitstempel
  runTransaction,  // Atomare Operationen
  Timestamp,       // TypeScript-Typ für Firestore Timestamps
} from 'firebase/firestore'

import { db } from '../lib/firebase'
import { createEmptyBoardFlat } from '../types/game'

// -----------------------------------------------------------------------------
// INTERFACES
// -----------------------------------------------------------------------------

// Struktur eines Matchmaking-Eintrags in Firestore
interface MatchmakingEntry {
  odg: string                     // User ID
  playerName: string              // Anzeigename
  status: 'waiting' | 'matched'   // Status
  gameId?: string                 // Spiel-ID wenn gematcht (optional mit ?)
  joinedAt: Timestamp             // Wann beigetreten
}

// Was der Hook zurückgibt
interface UseMatchmakingResult {
  isSearching: boolean               // Sucht gerade?
  gameId: string | null              // Gefundenes Spiel
  error: string | null               // Fehlermeldung
  joinQueue: () => Promise<void>     // In Warteschlange einreihen
  leaveQueue: () => Promise<void>    // Warteschlange verlassen
}

// -----------------------------------------------------------------------------
// DER HOOK
// -----------------------------------------------------------------------------

export const useMatchmaking = (
  currentUid: string | undefined,  // Aktuelle User ID
  playerName: string | undefined   // Spielername
): UseMatchmakingResult => {
  
  // STATE
  const [isSearching, setIsSearching] = useState(false)
  const [gameId, setGameId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // EFFECT: Eigenen Matchmaking-Eintrag beobachten
  // ---------------------------------------------------------------------------
  // Wenn ein anderer Spieler uns "matched", ändert sich unser Status
  
  useEffect(() => {
    // GUARD CLAUSES: Früh abbrechen wenn Bedingungen nicht erfüllt
    if (!currentUid || !isSearching) return

    // Referenz zu unserem Matchmaking-Dokument
    const entryRef = doc(db, 'matchmaking', currentUid)
    
    // REALTIME LISTENER
    // onSnapshot wird bei jeder Änderung des Dokuments aufgerufen
    const unsubscribe = onSnapshot(entryRef, (snapshot) => {
      if (snapshot.exists()) {
        // TYPE ASSERTION: Wir sagen TypeScript "das ist ein MatchmakingEntry"
        const data = snapshot.data() as MatchmakingEntry
        
        // Wurden wir gematcht?
        if (data.status === 'matched' && data.gameId) {
          console.log('Match found! Game ID:', data.gameId)
          setGameId(data.gameId)
          setIsSearching(false)
          
          // Matchmaking-Eintrag aufräumen
          // .catch(console.error) loggt Fehler aber ignoriert sie
          deleteDoc(entryRef).catch(console.error)
        }
      }
    })

    // CLEANUP: Listener entfernen
    return () => unsubscribe()
  }, [currentUid, isSearching])  // Dependencies

  // ---------------------------------------------------------------------------
  // EFFECT: Auf wartende Spieler hören und Match erstellen
  // ---------------------------------------------------------------------------
  // NUR der älteste Spieler erstellt das Match (verhindert Race Conditions)
  
  useEffect(() => {
    if (!currentUid || !isSearching || !playerName) return

    // FIRESTORE QUERY
    // Holt alle wartenden Spieler, sortiert nach Beitrittszeit
    const matchmakingRef = collection(db, 'matchmaking')
    const q = query(
      matchmakingRef,
      where('status', '==', 'waiting'),   // Nur wartende
      orderBy('joinedAt', 'asc'),          // Älteste zuerst
      limit(10)                            // Max 10 Ergebnisse
    )

    // REALTIME LISTENER auf die Query
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Snapshot in Array umwandeln
      // .map() mit Object Spread (...) um ID hinzuzufügen
      const waitingPlayers = snapshot.docs.map((d) => ({ 
        odg: d.id,          // Dokument-ID als 'odg'
        ...d.data()         // Alle anderen Felder
      } as MatchmakingEntry & { odg: string }))  // Type Intersection

      console.log('Waiting players:', waitingPlayers.map(p => p.playerName))

      // Brauchen mindestens 2 Spieler
      if (waitingPlayers.length < 2) {
        console.log('Not enough players yet')
        return
      }

      // BIN ICH DER ÄLTESTE?
      // Nur der älteste erstellt das Match (verhindert Doppel-Erstellung)
      const amIOldest = waitingPlayers[0].odg === currentUid
      
      if (!amIOldest) {
        console.log('Waiting for oldest player to create match...')
        return
      }

      // ICH bin der Älteste - Match erstellen!
      const opponent = waitingPlayers[1]  // Zweiter in der Liste
      console.log('I am oldest, creating match with:', opponent.playerName)

      try {
        // FIRESTORE TRANSACTION
        // Transactions sind atomar: Entweder alle Operationen oder keine
        // Das verhindert Race Conditions
        await runTransaction(db, async (transaction) => {
          // Referenzen zu beiden Matchmaking-Einträgen
          const myEntryRef = doc(db, 'matchmaking', currentUid)
          const opponentEntryRef = doc(db, 'matchmaking', opponent.odg)
          
          // Beide Einträge lesen (innerhalb der Transaction)
          const myEntry = await transaction.get(myEntryRef)
          const opponentEntry = await transaction.get(opponentEntryRef)
          
          // Validierung: Sind beide noch "waiting"?
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
          
          // FARBEN ZUFÄLLIG ZUWEISEN
          // Math.random() gibt Zahl zwischen 0 und 1
          const iAmRed = Math.random() < 0.5
          
          // Conditional Assignment mit Ternary
          const redPlayer = iAmRed ? currentUid : opponent.odg
          const yellowPlayer = iAmRed ? opponent.odg : currentUid
          const redName = iAmRed ? playerName : opponent.playerName
          const yellowName = iAmRed ? opponent.playerName : playerName
          
          // NEUES SPIEL ERSTELLEN
          const gamesRef = collection(db, 'games')
          const newGameRef = doc(gamesRef)  // Neue ID generieren
          
          console.log('Creating game:', newGameRef.id)
          
          // Spiel-Dokument schreiben
          transaction.set(newGameRef, {
            players: { red: redPlayer, yellow: yellowPlayer },
            playerNames: { red: redName, yellow: yellowName },
            board: createEmptyBoardFlat(),  // Leeres Board (flach für Firestore)
            currentPlayer: 'red',
            status: 'playing',
            winner: null,
            winningCells: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
          
          // Beide Matchmaking-Einträge auf "matched" setzen
          transaction.update(myEntryRef, { status: 'matched', gameId: newGameRef.id })
          transaction.update(opponentEntryRef, { status: 'matched', gameId: newGameRef.id })
        })
        
        console.log('Match created successfully!')
      } catch (err) {
        // Transaction fehlgeschlagen (wahrscheinlich Race Condition)
        console.error('Match creation failed:', err)
      }
    })

    return () => unsubscribe()
  }, [currentUid, playerName, isSearching])

  // ---------------------------------------------------------------------------
  // useCallback: Warteschlange beitreten
  // ---------------------------------------------------------------------------
  // useCallback memorisiert die Funktion (erstellt sie nicht bei jedem Render neu)
  // Das ist wichtig für Performance und wenn die Funktion als Dependency verwendet wird
  
  const joinQueue = useCallback(async () => {
    if (!currentUid || !playerName) {
      setError('Nicht angemeldet')
      return
    }

    setError(null)
    setGameId(null)

    try {
      // Matchmaking-Eintrag erstellen
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
  }, [currentUid, playerName])  // Dependencies für useCallback

  // ---------------------------------------------------------------------------
  // useCallback: Warteschlange verlassen
  // ---------------------------------------------------------------------------
  const leaveQueue = useCallback(async () => {
    if (!currentUid) return

    try {
      const entryRef = doc(db, 'matchmaking', currentUid)
      await deleteDoc(entryRef)
      console.log('Left queue')
    } catch (err) {
      console.error('Error leaving queue:', err)
    } finally {
      // finally wird immer ausgeführt
      setIsSearching(false)
    }
  }, [currentUid])

  // ---------------------------------------------------------------------------
  // RETURN
  // ---------------------------------------------------------------------------
  return {
    isSearching,
    gameId,
    error,
    joinQueue,
    leaveQueue,
  }
}
