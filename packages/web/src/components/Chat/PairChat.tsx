// =============================================================================
// PAIR CHAT COMPONENT
// =============================================================================
// Collaborative text field with color-coded authorship using CRDT

import { useState, useEffect, useRef, useCallback } from 'react'
import { Typography, Space, Card } from 'antd'
import { usePairChatCRDT } from '../../hooks/usePairChatCRDT'
import { CRDTOperation } from '../../types/crdt'
import { groupByAuthor, documentToText, createCharacterId } from '../../utils/crdtEngine'
import { getNextTimestamp } from '../../utils/lamportTimestamp'
import { Player } from '../../types/game'

const { Text } = Typography

interface PairChatProps {
  pairId: string | null
  currentUid: string | undefined
  myColor: Player | null
  opponentUid: string | undefined
}

const MAX_CHARACTERS = 5000

// Color mapping for players
const getAuthorColor = (author: string, myUid: string | undefined, myColor: Player | null, opponentUid: string | undefined): string => {
  if (!myUid || !myColor || !opponentUid) return '#000000'
  
  if (author === myUid) {
    // My color
    return myColor === 'red' ? '#f5222d' : '#fadb14'
  } else if (author === opponentUid) {
    // Opponent color
    return myColor === 'red' ? '#fadb14' : '#f5222d'
  }
  
  return '#000000' // Default color
}

export const PairChat = ({ pairId, currentUid, myColor, opponentUid }: PairChatProps) => {
  const { document, loading, error, sendOperations } = usePairChatCRDT(pairId, currentUid)
  const [localText, setLocalText] = useState('')
  const sequenceNumberRef = useRef(0)
  const contentEditableRef = useRef<HTMLDivElement>(null)
  const isApplyingRemoteChangeRef = useRef(false)
  const lastKnownTextRef = useRef('')  // Track last known text to avoid stale closure issues

  // Render colored segments when document changes
  useEffect(() => {
    if (!contentEditableRef.current) return

    const segments = groupByAuthor(document.characters)
    
    // Save cursor position before DOM update
    const selection = window.getSelection()
    let cursorPosition = 0
    if (selection && selection.rangeCount > 0 && contentEditableRef.current) {
      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(contentEditableRef.current)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      cursorPosition = preCaretRange.toString().length
    }

    // Render colored segments
    const html = segments.map(segment => {
      const color = getAuthorColor(segment.author, currentUid, myColor, opponentUid)
      const escapedText = segment.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
      return `<span style="color: ${color}">${escapedText}</span>`
    }).join('')

    // Set flag to prevent handleInput from triggering during DOM update
    isApplyingRemoteChangeRef.current = true
    
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = html || '<br>'
    }

    // Restore cursor position
    if (selection && cursorPosition > 0 && contentEditableRef.current) {
      try {
        const range = window.document.createRange()
        const walker = window.document.createTreeWalker(
          contentEditableRef.current,
          NodeFilter.SHOW_TEXT,
          null
        )
        
        let charCount = 0
        let node: Node | null = null
        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent?.length || 0
          if (charCount + nodeLength >= cursorPosition) {
            range.setStart(node, cursorPosition - charCount)
            range.setEnd(node, cursorPosition - charCount)
            selection.removeAllRanges()
            selection.addRange(range)
            break
          }
          charCount += nodeLength
        }
      } catch (e) {
        // Ignore cursor restoration errors
      }
    }

    // Reset flag after DOM update is complete
    isApplyingRemoteChangeRef.current = false

    const text = documentToText(document)
    setLocalText(text)
    lastKnownTextRef.current = text  // Update ref for next diff
  }, [document, currentUid, myColor, opponentUid])

  // Initialize sequence number from existing document
  useEffect(() => {
    if (document.characters.length > 0 && currentUid) {
      const existingIds = document.characters
        .filter(c => c.author === currentUid)
        .map(c => {
          const parts = c.id.split(':')
          return parts.length > 1 ? parseInt(parts[1], 10) : -1
        })
      if (existingIds.length > 0) {
        const maxSeq = Math.max(...existingIds) + 1
        if (maxSeq > sequenceNumberRef.current) {
          sequenceNumberRef.current = maxSeq
        }
      }
    }
  }, [document, currentUid])

  // Handle contentEditable input
  const handleInput = useCallback(() => {
    // Skip if we're applying remote changes to prevent feedback loop
    if (isApplyingRemoteChangeRef.current) return
    if (!contentEditableRef.current || !currentUid || !pairId) return

    const newText = contentEditableRef.current.innerText || ''

    // Enforce character limit
    if (newText.length > MAX_CHARACTERS) {
      // Restore previous text
      isApplyingRemoteChangeRef.current = true
      const segments = groupByAuthor(document.characters)
      const html = segments.map(segment => {
        const color = getAuthorColor(segment.author, currentUid, myColor, opponentUid)
        const escapedText = segment.text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;')
        return `<span style="color: ${color}">${escapedText}</span>`
      }).join('')
      contentEditableRef.current.innerHTML = html || '<br>'
      isApplyingRemoteChangeRef.current = false
      return
    }

    setLocalText(newText)

    // Use lastKnownTextRef to avoid stale closure issues
    const oldText = lastKnownTextRef.current
    
    // If no change, skip
    if (oldText === newText) return

    const operations: CRDTOperation[] = []

    // Use array order directly (maintained by insertCharacter) - NOT timestamp sorting
    const chars = document.characters

    // Smart diff algorithm using prefix/suffix matching
    // This correctly handles insertions in the middle without re-attributing existing text
    
    // Find common prefix length
    let prefixLen = 0
    while (prefixLen < oldText.length && prefixLen < newText.length && 
           oldText[prefixLen] === newText[prefixLen]) {
      prefixLen++
    }
    
    // Find common suffix length (but don't overlap with prefix)
    let suffixLen = 0
    while (suffixLen < oldText.length - prefixLen && 
           suffixLen < newText.length - prefixLen &&
           oldText[oldText.length - 1 - suffixLen] === newText[newText.length - 1 - suffixLen]) {
      suffixLen++
    }
    
    // Calculate the changed region
    const oldMiddleStart = prefixLen
    const oldMiddleEnd = oldText.length - suffixLen
    const newMiddleStart = prefixLen
    const newMiddleEnd = newText.length - suffixLen
    
    // Delete characters in the old middle region (in reverse order to maintain indices)
    for (let i = oldMiddleEnd - 1; i >= oldMiddleStart; i--) {
      if (i < chars.length) {
        operations.push({
          type: 'delete',
          charId: chars[i].id,
          timestamp: getNextTimestamp(),
        })
      }
    }
    
    // Insert characters in the new middle region
    for (let i = newMiddleStart; i < newMiddleEnd; i++) {
      // Find afterId - the character before the insertion point
      let afterId: string | null = null
      
      // The insertion point in the original array
      // We want to insert after the character at (prefixLen - 1) plus any already inserted characters
      const insertAfterIndex = prefixLen - 1 + (i - newMiddleStart)
      
      if (insertAfterIndex >= 0) {
        if (i === newMiddleStart) {
          // First insertion - insert after the last prefix character
          if (prefixLen > 0 && prefixLen - 1 < chars.length) {
            afterId = chars[prefixLen - 1].id
          }
        } else {
          // Subsequent insertions - insert after the previously inserted character
          // The previous operation was an insert, use its charId
          const prevOp = operations[operations.length - 1]
          if (prevOp && prevOp.type === 'insert') {
            afterId = prevOp.charId
          }
        }
      }
      
      const charId = createCharacterId(currentUid, sequenceNumberRef.current++)
      operations.push({
        type: 'insert',
        afterId,
        char: newText[i],
        charId,
        author: currentUid,
        timestamp: getNextTimestamp(),
      })
    }

    if (operations.length > 0) {
      // Update lastKnownTextRef immediately to avoid duplicate operations
      lastKnownTextRef.current = newText
      
      // Send operations immediately (no debounce)
      sendOperations(operations)
    }
  }, [document, currentUid, pairId, myColor, opponentUid, sendOperations])


  if (loading) {
    return (
      <Card size="small">
        <div
          contentEditable={false}
          style={{
            minHeight: '400px',
            padding: '8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            color: '#8c8c8c',
          }}
        >
          Lade Textfeld...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card size="small">
        <Text type="danger">Fehler: {error}</Text>
        <div
          contentEditable={false}
          style={{
            minHeight: '400px',
            padding: '8px',
            border: '1px solid #ff4d4f',
            borderRadius: '4px',
            backgroundColor: '#fff2f0',
            color: '#8c8c8c',
          }}
        >
          Fehler beim Laden
        </div>
      </Card>
    )
  }

  const characterCount = localText.length
  const remainingChars = MAX_CHARACTERS - characterCount

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Gemeinsames Textfeld ({characterCount}/{MAX_CHARACTERS} Zeichen)
            {remainingChars < 100 && (
              <Text type="warning" style={{ marginLeft: 8 }}>
                {remainingChars} verbleibend
              </Text>
            )}
          </Text>
        </div>
        <div
          ref={contentEditableRef}
          contentEditable
          onInput={handleInput}
          suppressContentEditableWarning
          style={{
            minHeight: '400px',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fff',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
            outline: 'none',
          }}
        />
        <style>{`
          [contenteditable][data-placeholder]:empty:before {
            content: attr(data-placeholder);
            color: #bfbfbf;
            pointer-events: none;
          }
        `}</style>
        <div style={{ fontSize: 11, color: '#8c8c8c', display: 'flex', gap: '16px' }}>
          <Text type="secondary">
            <span style={{ color: '#f5222d' }}>●</span> Rot: {myColor === 'red' ? 'Du' : 'Gegner'}
          </Text>
          <Text type="secondary">
            <span style={{ color: '#fadb14' }}>●</span> Gelb: {myColor === 'yellow' ? 'Du' : 'Gegner'}
          </Text>
        </div>
      </Space>
    </Card>
  )
}

