// =============================================================================
// CUSTOM HOOK - useOpponentHistory
// =============================================================================
// Dieser Hook lädt die Spielhistorie gegen alle Gegner.
// Die Daten kommen aus der userHistory/{odg}/opponents Subcollection.
//
// FIRESTORE SUBCOLLECTIONS:
// Firestore erlaubt Collections innerhalb von Dokumenten.
// Struktur: userHistory/{odg}/opponents/{opponentId}
// Das ist effizienter als alle Daten in einem Dokument zu speichern.

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

// -----------------------------------------------------------------------------
// INTERFACE FÜR GEGNER-DATENSATZ
// -----------------------------------------------------------------------------
export interface OpponentRecord {
  odg: string        // Gegner User-ID
  opponentName: string    // Gegner-Name
  wins: number            // Siege gegen diesen Gegner
  losses: number          // Niederlagen gegen diesen Gegner
  draws: number           // Unentschieden
  lastPlayed: Date        // Wann zuletzt gespielt
}

// -----------------------------------------------------------------------------
// DER HOOK
// -----------------------------------------------------------------------------
// Parameter odg kann undefined sein (wenn nicht eingeloggt)

export const useOpponentHistory = (odg: string | undefined) => {
  // State für die Gegner-Liste
  const [opponents, setOpponents] = useState<OpponentRecord[]>([])
  const [loading, setLoading] = useState(true)

  // ---------------------------------------------------------------------------
  // EFFECT: Gegner-Daten laden
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Guard Clause: Abbrechen wenn keine User-ID
    if (!odg) {
      setLoading(false)
      return
    }

    // FIRESTORE SUBCOLLECTION REFERENZ
    // collection(db, 'collectionA', 'docId', 'collectionB')
    // Das holt die Subcollection 'opponents' innerhalb des User-Dokuments
    const historyRef = collection(db, 'userHistory', odg, 'opponents')
    
    // Query mit Sortierung
    // orderBy('lastPlayed', 'desc') = Neueste zuerst
    const q = query(historyRef, orderBy('lastPlayed', 'desc'))

    // REALTIME LISTENER
    // onSnapshot liefert Updates wenn sich Daten ändern
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Snapshot zu Array von OpponentRecord umwandeln
      const records: OpponentRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          odg: doc.id,  // Dokument-ID ist die Gegner-ID
          opponentName: data.opponentName,
          wins: data.wins || 0,      // Default 0 wenn nicht vorhanden
          losses: data.losses || 0,
          draws: data.draws || 0,
          // Firestore Timestamp zu JavaScript Date konvertieren
          // Optional Chaining + toDate() Methodenaufruf
          lastPlayed: (data.lastPlayed as Timestamp)?.toDate() || new Date(),
        }
      })
      setOpponents(records)
      setLoading(false)
    })

    // Cleanup: Listener entfernen
    return () => unsubscribe()
  }, [odg])  // Nur neu ausführen wenn odg sich ändert

  // Return Object Shorthand
  return { opponents, loading }
}
