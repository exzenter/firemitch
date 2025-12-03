import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface OpponentRecord {
  odg: string
  opponentName: string
  wins: number
  losses: number
  draws: number
  lastPlayed: Date
}

export const useOpponentHistory = (odg: string | undefined) => {
  const [opponents, setOpponents] = useState<OpponentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!odg) {
      setLoading(false)
      return
    }

    const historyRef = collection(db, 'userHistory', odg, 'opponents')
    const q = query(historyRef, orderBy('lastPlayed', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: OpponentRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          odg: doc.id,
          opponentName: data.opponentName,
          wins: data.wins || 0,
          losses: data.losses || 0,
          draws: data.draws || 0,
          lastPlayed: (data.lastPlayed as Timestamp)?.toDate() || new Date(),
        }
      })
      setOpponents(records)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [odg])

  return { opponents, loading }
}

