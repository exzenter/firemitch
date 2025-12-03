// =============================================================================
// REACT KOMPONENTE - PlayerSetup (Spieler-Einrichtung)
// =============================================================================
// Diese Komponente zeigt das Setup für ein lokales 2-Spieler-Spiel.
// Spieler können ihre Namen eingeben bevor das Spiel startet.

import { useState } from 'react'

// ANT DESIGN KOMPONENTEN
import { Card, Input, Button, Space, Typography, Divider } from 'antd'
import { UserOutlined, PlayCircleOutlined } from '@ant-design/icons'

// ZUSTAND STORE
import { useGameStore } from '../stores/gameStore'

// Destructuring
const { Text } = Typography

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
export const PlayerSetup = () => {
  // ---------------------------------------------------------------------------
  // LOKALER STATE FÜR FORMULAR-EINGABEN
  // ---------------------------------------------------------------------------
  // Diese States gehören nur zu diesem Formular, nicht global
  // Daher useState statt Zustand Store
  
  const [redName, setRedName] = useState('')
  const [yellowName, setYellowName] = useState('')
  
  // Funktionen aus dem Store holen
  const { setPlayers, startGame } = useGameStore()

  // ---------------------------------------------------------------------------
  // EVENT HANDLER
  // ---------------------------------------------------------------------------
  const handleStart = () => {
    // FALLBACK MIT || OPERATOR
    // Wenn redName leer/falsy ist, verwende 'Spieler 1'
    // .trim() entfernt Leerzeichen am Anfang/Ende
    const player1 = redName.trim() || 'Spieler 1'
    const player2 = yellowName.trim() || 'Spieler 2'
    
    // Store-Funktionen aufrufen
    setPlayers(player1, player2)
    startGame()
  }

  // Namen sind optional, also kann man immer starten
  const canStart = true

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    // Card mit Titel
    <Card title="Neues Spiel starten" style={{ width: 400, maxWidth: '100%' }}>
      
      {/* Space stapelt Kinder vertikal mit Abständen */}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        
        {/* Modus-Anzeige */}
        <Text type="secondary">Modus: 1 Gerät, 2 Spieler</Text>
        
        <Divider style={{ margin: '12px 0' }} />
        
        {/* ===== SPIELER 1 (ROT) ===== */}
        <div>
          {/* Text mit style prop für Farbe */}
          <Text strong style={{ color: '#f5222d' }}>🔴 Spieler 1 (Rot)</Text>
          
          {/* ANT DESIGN INPUT */}
          <Input
            placeholder="Name eingeben..."
            prefix={<UserOutlined />}  // Icon links im Input
            value={redName}             // Controlled Component: Wert aus State
            
            // onChange Handler
            // e.target.value ist der neue Input-Wert
            onChange={(e) => setRedName(e.target.value)}
            
            // Enter-Taste startet das Spiel
            onPressEnter={handleStart}
            
            style={{ marginTop: 8 }}
          />
        </div>
        
        {/* ===== SPIELER 2 (GELB) ===== */}
        <div>
          <Text strong style={{ color: '#faad14' }}>🟡 Spieler 2 (Gelb)</Text>
          <Input
            placeholder="Name eingeben..."
            prefix={<UserOutlined />}
            value={yellowName}
            onChange={(e) => setYellowName(e.target.value)}
            onPressEnter={handleStart}
            style={{ marginTop: 8 }}
          />
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        {/* ===== START BUTTON ===== */}
        <Button
          type="primary"           // Primärer Button-Style (gefüllt, farbig)
          icon={<PlayCircleOutlined />}
          onClick={handleStart}
          disabled={!canStart}     // disabled wenn canStart false
          block                    // Full-width Button
          size="large"
        >
          Spiel starten
        </Button>
      </Space>
    </Card>
  )
}
