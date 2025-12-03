// =============================================================================
// USE PAIR CHAT CRDT HOOK
// =============================================================================
// Hook for managing CRDT-based collaborative text field via Firestore operations

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  doc,
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { CRDTDocument, CRDTOperation, FirestoreOperation } from '../types/crdt'
import { applyOperation, createEmptyDocument, documentToText } from '../utils/crdtEngine'

interface UsePairChatCRDTResult {
  document: CRDTDocument
  text: string
  loading: boolean
  error: string | null
  sendOperation: (operation: CRDTOperation) => Promise<void>
  sendOperations: (operations: CRDTOperation[]) => Promise<void>
}

export const usePairChatCRDT = (
  pairId: string | null,
  currentUid: string | undefined
): UsePairChatCRDTResult => {
  const [document, setDocument] = useState<CRDTDocument>(createEmptyDocument())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track processed operation IDs to avoid duplicates
  const processedOpsRef = useRef<Set<string>>(new Set())

  // Initialize pair chat document if it doesn't exist, then set up listener
  useEffect(() => {
    if (!pairId || !currentUid) {
      setLoading(false)
      return
    }

    let unsubscribe: (() => void) | null = null

    const initializeAndListen = async () => {
      try {
        setLoading(true)
        setError(null)

        // First, ensure the pair chat document exists
        const pairChatRef = doc(db, 'pairChats', pairId)
        
        // Try to get the document, create if it doesn't exist
        let pairChatSnap = await getDoc(pairChatRef)
        
        if (!pairChatSnap.exists()) {
          // Create pair chat document with both players
          const players = pairId.split('_').sort()
          await setDoc(pairChatRef, {
            players: players,
            lastUpdated: serverTimestamp(),
          })
          
          // Verify the document was created by reading it again
          pairChatSnap = await getDoc(pairChatRef)
          if (!pairChatSnap.exists()) {
            throw new Error('Failed to create pair chat document')
          }
        }

        // Verify current user is in the players array
        const players = pairChatSnap.data()?.players || []
        if (!players.includes(currentUid)) {
          throw new Error('User not authorized for this pair chat')
        }

        // Now that the document exists and user is verified, set up the listener
        const operationsRef = collection(db, 'pairChats', pairId, 'operations')
        const q = query(operationsRef, orderBy('timestamp', 'asc'), limit(1000))

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added' || change.type === 'modified') {
                const data = change.doc.data() as FirestoreOperation
                
                // Create unique operation key (type + charId to distinguish insert vs delete)
                const opKey = `${data.type}:${data.charId}`

                // Skip if already processed
                if (processedOpsRef.current.has(opKey)) {
                  return
                }

                // Convert Firestore operation to CRDT operation
                let operation: CRDTOperation
                if (data.type === 'insert') {
                  operation = {
                    type: 'insert',
                    afterId: data.afterId ?? null,
                    char: data.char ?? '',
                    charId: data.charId,
                    author: data.author,
                    timestamp: data.timestamp,
                  }
                } else {
                  operation = {
                    type: 'delete',
                    charId: data.charId,
                    timestamp: data.timestamp,
                  }
                }

                // Mark as processed and apply operation
                processedOpsRef.current.add(opKey)
                setDocument((prevDoc) => applyOperation(prevDoc, operation))
              }
            })
            setLoading(false)
          },
          (err) => {
            console.error('Error listening to operations:', err)
            setError(err.message)
            setLoading(false)
          }
        )
      } catch (err) {
        console.error('Failed to initialize pair chat:', err)
        setError('Failed to initialize chat')
        setLoading(false)
      }
    }

    initializeAndListen()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [pairId, currentUid])

  // Send single operation to Firestore
  const sendOperation = useCallback(
    async (operation: CRDTOperation) => {
      if (!pairId || !currentUid) return

      const charId = operation.charId
      const opKey = `${operation.type}:${charId}`

      try {
        const operationsRef = collection(db, 'pairChats', pairId, 'operations')
        
        // Build operation object - don't include undefined fields (Firestore rejects them)
        const firestoreOp: Record<string, unknown> = {
          type: operation.type,
          charId: charId,
          timestamp: operation.timestamp,
          createdAt: serverTimestamp(),
        }
        
        if (operation.type === 'insert') {
          firestoreOp.afterId = operation.afterId
          firestoreOp.char = operation.char
          firestoreOp.author = operation.author
        } else {
          firestoreOp.afterId = null
          firestoreOp.author = ''
        }

        // Mark as processed before sending to prevent double application
        processedOpsRef.current.add(opKey)

        // Apply locally
        setDocument((prevDoc) => applyOperation(prevDoc, operation))

        // Send to Firestore (listener will skip since opKey is already processed)
        await addDoc(operationsRef, firestoreOp)
      } catch (err) {
        console.error('Failed to send operation:', err)
        setError('Failed to send operation')
      }
    },
    [pairId, currentUid]
  )

  // Send multiple operations (for batch updates)
  const sendOperations = useCallback(
    async (operations: CRDTOperation[]) => {
      if (!pairId || !currentUid || operations.length === 0) return

      try {
        const operationsRef = collection(db, 'pairChats', pairId, 'operations')

        // Mark all as processed before sending to prevent double application
        operations.forEach((op) => {
          const opKey = `${op.type}:${op.charId}`
          processedOpsRef.current.add(opKey)
        })

        // Apply all locally
        setDocument((prevDoc) => {
          let newDoc = prevDoc
          operations.forEach((op) => {
            newDoc = applyOperation(newDoc, op)
          })
          return newDoc
        })

        // Send all to Firestore (listener will skip since opKeys are already processed)
        const promises = operations.map((operation) => {
          // Build operation object - don't include undefined fields (Firestore rejects them)
          const firestoreOp: Record<string, unknown> = {
            type: operation.type,
            charId: operation.charId,
            timestamp: operation.timestamp,
            createdAt: serverTimestamp(),
          }
          
          if (operation.type === 'insert') {
            firestoreOp.afterId = operation.afterId
            firestoreOp.char = operation.char
            firestoreOp.author = operation.author
          } else {
            firestoreOp.afterId = null
            firestoreOp.author = ''
          }

          return addDoc(operationsRef, firestoreOp)
        })

        await Promise.all(promises)
      } catch (err) {
        console.error('Failed to send operations:', err)
        setError('Failed to send operations')
      }
    },
    [pairId, currentUid]
  )

  const text = documentToText(document)

  return {
    document,
    text,
    loading,
    error,
    sendOperation,
    sendOperations,
  }
}

