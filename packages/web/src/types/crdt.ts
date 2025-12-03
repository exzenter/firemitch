// =============================================================================
// CRDT TYPES & INTERFACES
// =============================================================================
// Types for Conflict-free Replicated Data Type (CRDT) text editing
// Each character has a unique ID that never changes, even when text moves

// -----------------------------------------------------------------------------
// CHARACTER INTERFACE
// -----------------------------------------------------------------------------
// Represents a single character in the CRDT document
export interface Character {
  id: string        // Unique ID: "{clientId}:{sequenceNumber}"
  char: string      // The character itself
  author: string    // User ID of who wrote it
  timestamp: number // Lamport timestamp for ordering
}

// -----------------------------------------------------------------------------
// CRDT OPERATIONS
// -----------------------------------------------------------------------------
// Operations are atomic changes to the document

export interface InsertOperation {
  type: 'insert'
  afterId: string | null  // After which character ID to insert (null = beginning)
  char: string           // Character to insert
  charId: string        // New unique character ID
  author: string        // User ID of author
  timestamp: number      // Lamport timestamp
}

export interface DeleteOperation {
  type: 'delete'
  charId: string         // Which character ID to delete
  timestamp: number      // Lamport timestamp
}

export type CRDTOperation = InsertOperation | DeleteOperation

// -----------------------------------------------------------------------------
// CRDT DOCUMENT INTERFACE
// -----------------------------------------------------------------------------
// The complete CRDT document structure
export interface CRDTDocument {
  characters: Character[]
}

// -----------------------------------------------------------------------------
// FIRESTORE OPERATION DOCUMENT
// -----------------------------------------------------------------------------
// How operations are stored in Firestore
export interface FirestoreOperation {
  type: 'insert' | 'delete'
  afterId: string | null
  char?: string
  charId: string
  author: string  // Author is required for inserts, empty string for deletes
  timestamp: number
  createdAt: any // Firestore Timestamp
}

// -----------------------------------------------------------------------------
// FIRESTORE PAIR CHAT DOCUMENT
// -----------------------------------------------------------------------------
// The pair chat metadata document
export interface FirestorePairChat {
  players: string[]  // [uid1, uid2]
  lastUpdated: any    // Firestore Timestamp
}

// -----------------------------------------------------------------------------
// TEXT SEGMENT FOR RENDERING
// -----------------------------------------------------------------------------
// Grouped consecutive characters by the same author for color rendering
export interface TextSegment {
  text: string      // The text content
  author: string    // Author user ID
  startIndex: number // Start position in sorted array
  endIndex: number    // End position in sorted array
}

