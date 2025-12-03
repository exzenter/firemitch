// =============================================================================
// REACT KOMPONENTE - Game (Lokales Spiel)
// =============================================================================
// Diese Komponente zeigt das lokale 2-Spieler-Spiel.
// Sie enthält: Spieler-Setup, Board, Statistik und Steuerung.

// ANT DESIGN KOMPONENTEN
import { Card, Space, Typography, Button, Tag, Statistic, Row, Col, Divider } from 'antd'

// ANT DESIGN ICONS
import { ReloadOutlined, TrophyOutlined, HomeOutlined } from '@ant-design/icons'

// UNSERE KOMPONENTEN UND STORE
import { useGameStore } from '../stores/gameStore'
import { Board } from './Board'
import { PlayerSetup } from './PlayerSetup'

// Destructuring für kürzere Schreibweise
const { Title, Text } = Typography

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
export const Game = () => {
  // ---------------------------------------------------------------------------
  // ZUSTAND STORE
  // ---------------------------------------------------------------------------
  // Wir holen alle benötigten Werte aus dem globalen Store
  // Die Komponente re-rendert automatisch wenn sich diese Werte ändern
  
  const { 
    currentPlayer,   // Wer ist am Zug
    winner,          // Gewinner (null wenn keiner)
    status,          // Spielstatus
    resetGame,       // Funktion: Neue Runde
    resetSession,    // Funktion: Kompletter Reset
    gameStarted,     // Wurde Spiel gestartet?
    players,         // Spielernamen { red, yellow }
    stats            // Session-Statistik { red, yellow, draws }
  } = useGameStore()

  // ---------------------------------------------------------------------------
  // CONDITIONAL RENDERING: SETUP-SCREEN
  // ---------------------------------------------------------------------------
  // Wenn Spiel noch nicht gestartet, zeige das Setup
  // "Early Return" Pattern - macht den Code lesbarer
  
  if (!gameStarted) {
    return <PlayerSetup />
  }

  // ---------------------------------------------------------------------------
  // HILFSFUNKTION: STATUS-NACHRICHT
  // ---------------------------------------------------------------------------
  // Gibt JSX basierend auf Spielstatus zurück
  
  const getStatusMessage = () => {
    // SWITCH STATEMENT
    // Wie if-else, aber sauberer für mehrere Fälle
    switch (status) {
      case 'won':
        return (
          // Space ist ein Ant Design Flex-Container mit Abständen
          <Space>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '24px' }} />
            <Text style={{ fontSize: '18px' }}>
              {/* Tag ist ein kleines Label/Badge */}
              <Tag
                color={winner === 'red' ? '#f5222d' : '#fadb14'}
                style={{ fontSize: '16px', padding: '4px 12px' }}
              >
                {/* Conditional Text basierend auf Gewinner */}
                {winner === 'red' ? players.red : players.yellow}
              </Tag>
              hat gewonnen!
            </Text>
          </Space>
        )
      
      case 'draw':
        return <Text style={{ fontSize: '18px' }}>Unentschieden! 🤝</Text>
      
      case 'playing':
        return (
          <Space>
            <Text style={{ fontSize: '16px', color: '#a1a1aa' }}>Am Zug:</Text>
            <Tag
              color={currentPlayer === 'red' ? '#f5222d' : '#fadb14'}
              style={{ fontSize: '16px', padding: '4px 12px' }}
            >
              {currentPlayer === 'red' ? players.red : players.yellow}
            </Tag>
          </Space>
        )
      
      default:
        return null  // Für TypeScript - alle Fälle müssen abgedeckt sein
    }
  }

  // Gesamtanzahl der Spiele in dieser Session
  const totalGames = stats.red + stats.yellow + stats.draws

  // ---------------------------------------------------------------------------
  // JSX RETURN
  // ---------------------------------------------------------------------------
  return (
    <Card
      style={{
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(245, 34, 45, 0.3)',
        borderRadius: '16px',
      }}
      // bodyStyle ändert den Style des Card-Inhalts
      bodyStyle={{ padding: '24px' }}
    >
      {/* Space mit vertikaler Richtung = stapelt Kinder vertikal */}
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        
        {/* ===== SESSION STATISTIK ===== */}
        <Card size="small" title="Session Statistik">
          {/* Row und Col sind das Grid-System von Ant Design */}
          {/* 24 Spalten insgesamt, span=8 = 1/3 Breite */}
          <Row gutter={16}>
            <Col span={8}>
              {/* Statistic ist eine Ant Design Komponente für Zahlen */}
              <Statistic 
                // JSX in title: span für Farbe
                title={<span style={{ color: '#f5222d' }}>🔴 {players.red}</span>}
                value={stats.red} 
                suffix="Siege"  // Text nach der Zahl
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title={<span style={{ color: '#faad14' }}>🟡 {players.yellow}</span>}
                value={stats.yellow} 
                suffix="Siege"
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="🤝 Unentschieden"
                value={stats.draws} 
              />
            </Col>
          </Row>
          
          {/* CONDITIONAL RENDERING mit && */}
          {/* Zeige nur wenn mindestens ein Spiel gespielt wurde */}
          {totalGames > 0 && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Gesamt: {totalGames} Spiele
            </Text>
          )}
        </Card>

        <Divider style={{ margin: '8px 0' }} />

        {/* ===== AKTUELLER STATUS ===== */}
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {/* Funktion aufrufen die JSX zurückgibt */}
            {getStatusMessage()}
          </Title>
        </div>

        {/* ===== SPIELBRETT ===== */}
        {/* Board ist unsere Board-Komponente */}
        <Board />

        {/* ===== BUTTONS ===== */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}  // Icon als Prop
            onClick={resetGame}         // Store-Funktion als Handler
            size="large"
          >
            Nächste Runde
          </Button>
          <Button
            icon={<HomeOutlined />}
            onClick={resetSession}
            size="large"
          >
            Neue Session
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
