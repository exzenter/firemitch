// =============================================================================
// CRDT ENGINE
// =============================================================================
// Core CRDT logic for applying operations, managing characters, and rendering

import { Character, CRDTOperation, CRDTDocument, TextSegment } from '../types/crdt'
import { getNextTimestamp, updateTimestamp } from './lamportTimestamp'

// -----------------------------------------------------------------------------
// APPLY OPERATION TO DOCUMENT
// -----------------------------------------------------------------------------
// Applies a single CRDT operation to the document
export const applyOperation = (
  document: CRDTDocument,
  operation: CRDTOperation
): CRDTDocument => {
  // Update our Lamport timestamp based on received operation
  updateTimestamp(operation.timestamp)

  if (operation.type === 'insert') {
    return insertCharacter(document, operation.afterId, operation.char, operation.charId, operation.author, operation.timestamp)
  } else if (operation.type === 'delete') {
    return deleteCharacter(document, operation.charId)
  }

  return document
}

// -----------------------------------------------------------------------------
// INSERT CHARACTER
// -----------------------------------------------------------------------------
// Inserts a character after the specified character ID (or at beginning if afterId is null)
export const insertCharacter = (
  document: CRDTDocument,
  afterId: string | null,
  char: string,
  charId: string,
  author: string,
  timestamp: number
): CRDTDocument => {
  const newCharacter: Character = {
    id: charId,
    char,
    author,
    timestamp,
  }

  // If afterId is null, insert at beginning
  if (afterId === null) {
    return {
      characters: [newCharacter, ...document.characters],
    }
  }

  // Find the index of the character with afterId
  const afterIndex = document.characters.findIndex(c => c.id === afterId)

  // If not found, append to end (shouldn't happen in normal operation)
  if (afterIndex === -1) {
    return {
      characters: [...document.characters, newCharacter],
    }
  }

  // Insert after the found character
  const newCharacters = [...document.characters]
  newCharacters.splice(afterIndex + 1, 0, newCharacter)

  return {
    characters: newCharacters,
  }
}

// -----------------------------------------------------------------------------
// DELETE CHARACTER
// -----------------------------------------------------------------------------
// Removes a character by its ID (idempotent - safe to delete already deleted)
export const deleteCharacter = (
  document: CRDTDocument,
  charId: string
): CRDTDocument => {
  return {
    characters: document.characters.filter(c => c.id !== charId),
  }
}

// -----------------------------------------------------------------------------
// SORT CHARACTERS BY TIMESTAMP
// -----------------------------------------------------------------------------
// Sorts characters by timestamp for correct ordering
// If timestamps are equal, use character ID for deterministic ordering
export const sortCharacters = (characters: Character[]): Character[] => {
  return [...characters].sort((a, b) => {
    // First sort by timestamp
    if (a.timestamp !== b.timestamp) {
      return a.timestamp - b.timestamp
    }
    // If timestamps are equal, sort by ID for deterministic ordering
    return a.id.localeCompare(b.id)
  })
}

// -----------------------------------------------------------------------------
// GROUP CONSECUTIVE CHARACTERS BY AUTHOR
// -----------------------------------------------------------------------------
// Groups consecutive characters from the same author for color rendering
// Uses array order (maintained by insertCharacter) - NOT timestamp sorting
export const groupByAuthor = (characters: Character[]): TextSegment[] => {
  if (characters.length === 0) {
    return []
  }

  // Use array order directly - this preserves the insertion positions
  const segments: TextSegment[] = []

  let currentSegment: TextSegment | null = null

  characters.forEach((char, index) => {
    if (!currentSegment || currentSegment.author !== char.author) {
      // Start new segment
      if (currentSegment) {
        segments.push(currentSegment)
      }
      currentSegment = {
        text: char.char,
        author: char.author,
        startIndex: index,
        endIndex: index,
      }
    } else {
      // Continue current segment
      currentSegment.text += char.char
      currentSegment.endIndex = index
    }
  })

  // Don't forget the last segment
  if (currentSegment) {
    segments.push(currentSegment)
  }

  return segments
}

// -----------------------------------------------------------------------------
// CONVERT DOCUMENT TO PLAIN TEXT
// -----------------------------------------------------------------------------
// Converts CRDT document to plain string for textarea value
// Uses array order (maintained by insertCharacter) - NOT timestamp sorting
export const documentToText = (document: CRDTDocument): string => {
  return document.characters.map(c => c.char).join('')
}

// -----------------------------------------------------------------------------
// CREATE CHARACTER ID
// -----------------------------------------------------------------------------
// Creates a unique character ID: "{clientId}:{sequenceNumber}"
export const createCharacterId = (clientId: string, sequenceNumber: number): string => {
  return `${clientId}:${sequenceNumber}`
}

// -----------------------------------------------------------------------------
// FIND CHARACTER ID AT POSITION
// -----------------------------------------------------------------------------
// Finds the character ID at a given text position (for insert operations)
// Uses array order (maintained by insertCharacter) - NOT timestamp sorting
export const findCharacterIdAtPosition = (
  document: CRDTDocument,
  position: number
): string | null => {
  const chars = document.characters

  if (position === 0) {
    return null // Insert at beginning
  }

  if (position >= chars.length) {
    // Insert at end - return last character ID
    return chars.length > 0 ? chars[chars.length - 1].id : null
  }

  // Return the character ID before the position
  return chars[position - 1].id
}

// -----------------------------------------------------------------------------
// CREATE EMPTY DOCUMENT
// -----------------------------------------------------------------------------
export const createEmptyDocument = (): CRDTDocument => {
  return {
    characters: [],
  }
}

// -----------------------------------------------------------------------------
// DIFF TEXT CHANGES
// -----------------------------------------------------------------------------
// Compares old and new text, returns operations needed to transform old to new
// This is used when user types in textarea - we need to convert text changes to CRDT operations
export const diffTextChanges = (
  oldDocument: CRDTDocument,
  newText: string,
  author: string,
  clientId: string
): CRDTOperation[] => {
  const oldText = documentToText(oldDocument)
  const operations: CRDTOperation[] = []

  // Simple diff algorithm: compare character by character
  // This is not optimal but works for our use case
  let oldIndex = 0
  let newIndex = 0
  let sequenceNumber = 0

  // Find the highest sequence number in existing characters from this client
  const existingIds = oldDocument.characters
    .filter(c => c.author === author)
    .map(c => {
      const parts = c.id.split(':')
      return parts.length > 1 ? parseInt(parts[1], 10) : -1
    })
  sequenceNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0

  while (oldIndex < oldText.length || newIndex < newText.length) {
    if (oldIndex < oldText.length && newIndex < newText.length && oldText[oldIndex] === newText[newIndex]) {
      // Characters match, move forward
      oldIndex++
      newIndex++
    } else if (oldIndex < oldText.length && (newIndex >= newText.length || oldText[oldIndex] !== newText[newIndex])) {
      // Character deleted
      const sorted = sortCharacters(oldDocument.characters)
      if (oldIndex < sorted.length) {
        operations.push({
          type: 'delete',
          charId: sorted[oldIndex].id,
          timestamp: getNextTimestamp(),
        })
      }
      oldIndex++
    } else if (newIndex < newText.length) {
      // Character inserted
      const afterId = oldIndex > 0
        ? findCharacterIdAtPosition(oldDocument, oldIndex)
        : null
      const charId = createCharacterId(clientId, sequenceNumber++)
      operations.push({
        type: 'insert',
        afterId,
        char: newText[newIndex],
        charId,
        author,
        timestamp: getNextTimestamp(),
      })
      newIndex++
    }
  }

  return operations
}

