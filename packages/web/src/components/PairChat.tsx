import { useState, useEffect, useRef } from 'react'
import { Input, Typography, Space } from 'antd'
import { usePairChat } from '../hooks/usePairChat'
import { Player } from '../types/game'

const { TextArea } = Input
const { Text } = Typography

interface PairChatProps {
  pairId: string | null
  currentUid: string | undefined
  myColor: Player | null
}

const MAX_CHARS = 5000

export const PairChat = ({ pairId, currentUid, myColor }: PairChatProps) => {
  const { text, loading, error, updateText } = usePairChat(pairId, currentUid)
  const [localText, setLocalText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Synchronisiere lokalen Text mit Firestore Text
  useEffect(() => {
    setLocalText(text)
  }, [text])

  // Cleanup timeout beim Unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value

    // Zeichenlimit prüfen
    if (newText.length > MAX_CHARS) {
      return // Ignoriere Eingabe wenn Limit überschritten
    }

    setLocalText(newText)

    // Debounced Update zu Firestore
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }

    updateTimeoutRef.current = setTimeout(() => {
      updateText(newText)
    }, 500) // 500ms Debounce
  }

  // Textfarbe basierend auf Spielerfarbe
  const getTextColor = () => {
    if (!myColor) return '#ffffff'
    return myColor === 'red' ? '#f5222d' : '#fadb14'
  }

  const remainingChars = MAX_CHARS - localText.length
  const isNearLimit = remainingChars < 100

  if (!pairId || !currentUid) {
    return null
  }

  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }}>
      <TextArea
        ref={textareaRef}
        value={localText}
        onChange={handleChange}
        placeholder="Gemeinsames Textfeld - beide Spieler können hier schreiben..."
        rows={20}
        maxLength={MAX_CHARS}
        disabled={loading}
        style={{
          width: '100%',
          color: getTextColor(),
          fontSize: '14px',
          fontFamily: 'monospace',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          border: `1px solid ${getTextColor()}40`,
          borderRadius: '8px',
        }}
        showCount={{
          formatter: ({ count, maxLength }) => {
            const max = maxLength ?? MAX_CHARS
            const remaining = max - count
            return `${count}/${max}${remaining < 100 ? ` (${remaining} übrig)` : ''}`
          },
        }}
      />
      {error && (
        <Text type="danger" style={{ fontSize: '12px' }}>
          {error}
        </Text>
      )}
      {isNearLimit && (
        <Text type="warning" style={{ fontSize: '12px' }}>
          Noch {remainingChars} Zeichen verfügbar
        </Text>
      )}
    </Space>
  )
}

