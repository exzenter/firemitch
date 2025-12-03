// =============================================================================
// REACT KOMPONENTE - AIGame (Spiel gegen KI)
// =============================================================================
// Diese Komponente ermöglicht das Spielen gegen eine KI.
// Wenn der User eingeloggt ist, wird der Name automatisch übernommen.
// Die KI spielt immer Gelb, der Spieler immer Rot.

import { useState, useEffect, useCallback } from 'react'

// ANT DESIGN KOMPONENTEN
import { 
  Card, 
  Space, 
  Typography, 
  Button, 
  Tag, 
  Statistic, 
  Row, 
  Col, 
  Divider,
  Input,
  Spin
} from 'antd'

// ANT DESIGN ICONS
import { 
  ReloadOutlined, 
  TrophyOutlined, 
  HomeOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons'

// UNSERE KOMPONENTEN UND STORE
import { Board } from './Board'
import { useGameStore } from '../../stores/gameStore'
import { useAuth } from '../../hooks/useAuth'
import { makeAIMove } from '../../utils/aiEngine'

// Destructuring für kürzere Schreibweise
const { Title, Text } = Typography

// -----------------------------------------------------------------------------
// PROPS INTERFACE
// -----------------------------------------------------------------------------
interface AIGameProps {
  onBack: () => void  // Callback zum Zurückkehren zum Menü
}

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
export const AIGame = ({ onBack }: AIGameProps) => {
  // ---------------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------------
  const [playerName, setPlayerName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  
  // Auth-Daten
  const { user, profile } = useAuth()
  
  // Game Store
  const { 
    board,
    currentPlayer,
    winner,
    status,
    players,
    stats,
    dropPiece,
    resetGame,
    setPlayers,
    startGame,
    resetSession
  } = useGameStore()

  // ---------------------------------------------------------------------------
  // AUTOMATISCHE NAMENSÜBERNAHME
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (profile?.displayName) {
      setPlayerName(profile.displayName)
    }
  }, [profile])

  // ---------------------------------------------------------------------------
  // KI-ZUG LOGIK
  // ---------------------------------------------------------------------------
  const makeAIMoveHandler = useCallback(async () => {
    if (status !== 'playing' || currentPlayer !== 'yellow') return
    
    setAiThinking(true)
    
    try {
      // KI berechnet den besten Zug
      const col = await makeAIMove(board, 'yellow', 600)
      
      // Zug ausführen
      dropPiece(col)
    } finally {
      setAiThinking(false)
    }
  }, [board, currentPlayer, status, dropPiece])

  // Wenn KI am Zug ist, automatisch spielen
  useEffect(() => {
    if (gameStarted && status === 'playing' && currentPlayer === 'yellow') {
      makeAIMoveHandler()
    }
  }, [gameStarted, currentPlayer, status, makeAIMoveHandler])

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------
  const handleStartGame = () => {
    const name = playerName.trim() || 'Spieler'
    setPlayers(name, 'KI')
    startGame()
    setGameStarted(true)
  }

  const handleNewRound = () => {
    resetGame()
  }

  const handleNewSession = () => {
    resetSession()
    setGameStarted(false)
  }

  const handleBack = () => {
    resetSession()
    setGameStarted(false)
    onBack()
  }

  // ---------------------------------------------------------------------------
  // SETUP SCREEN (wenn Spiel noch nicht gestartet)
  // ---------------------------------------------------------------------------
  if (!gameStarted) {
    return (
      <Card title="Spiel gegen KI" style={{ width: 400, maxWidth: '100%' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          
          <Text type="secondary">
            <RobotOutlined /> Du spielst gegen eine clevere KI!
          </Text>
          
          <Divider style={{ margin: '12px 0' }} />
          
          {/* Spieler-Info */}
          <div>
            <Text strong style={{ color: '#f5222d' }}>🔴 Du (Rot)</Text>
            
            {/* Wenn eingeloggt, zeige Namen automatisch */}
            {user && profile ? (
              <div style={{ marginTop: 8 }}>
                <Tag icon={<UserOutlined />} color="blue">
                  {profile.displayName}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  (eingeloggt)
                </Text>
              </div>
            ) : (
              <Input
                placeholder="Dein Name..."
                prefix={<UserOutlined />}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onPressEnter={handleStartGame}
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          
          {/* KI-Info */}
          <div>
            <Text strong style={{ color: '#faad14' }}>🟡 KI (Gelb)</Text>
            <div style={{ marginTop: 8 }}>
              <Tag icon={<RobotOutlined />} color="purple">
                Minimax KI
              </Tag>
            </div>
          </div>
          
          <Divider style={{ margin: '12px 0' }} />
          
          {/* Buttons */}
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={handleStartGame}
              block
              size="large"
            >
              Gegen KI spielen
            </Button>
            <Button
              icon={<HomeOutlined />}
              onClick={onBack}
              block
            >
              Zurück zum Menü
            </Button>
          </Space>
        </Space>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // HILFSFUNKTION: STATUS-NACHRICHT
  // ---------------------------------------------------------------------------
  const getStatusMessage = () => {
    switch (status) {
      case 'won':
        return (
          <Space>
            <TrophyOutlined style={{ color: '#faad14', fontSize: '24px' }} />
            <Text style={{ fontSize: '18px' }}>
              <Tag
                color={winner === 'red' ? '#f5222d' : '#fadb14'}
                style={{ fontSize: '16px', padding: '4px 12px' }}
              >
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
            {aiThinking ? (
              <>
                <Spin size="small" />
                <Text style={{ fontSize: '16px', color: '#722ed1' }}>
                  KI denkt nach...
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: '16px', color: '#a1a1aa' }}>Am Zug:</Text>
                <Tag
                  color={currentPlayer === 'red' ? '#f5222d' : '#fadb14'}
                  style={{ fontSize: '16px', padding: '4px 12px' }}
                >
                  {currentPlayer === 'red' ? players.red : players.yellow}
                </Tag>
              </>
            )}
          </Space>
        )
      
      default:
        return null
    }
  }

  const totalGames = stats.red + stats.yellow + stats.draws

  // ---------------------------------------------------------------------------
  // HAUPTRENDERING
  // ---------------------------------------------------------------------------
  return (
    <Card
      style={{
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(114, 46, 209, 0.3)',
        borderRadius: '16px',
      }}
      styles={{ body: { padding: '24px' } }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        
        {/* Session Statistik */}
        <Card size="small" title={<><RobotOutlined /> KI-Modus Statistik</>}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic 
                title={<span style={{ color: '#f5222d' }}>🔴 {players.red}</span>}
                value={stats.red} 
                suffix="Siege"
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
          
          {totalGames > 0 && (
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              Gesamt: {totalGames} Spiele
            </Text>
          )}
        </Card>

        <Divider style={{ margin: '8px 0' }} />

        {/* Aktueller Status */}
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {getStatusMessage()}
          </Title>
        </div>

        {/* Spielbrett - deaktiviert wenn KI am Zug */}
        <div style={{ 
          pointerEvents: (aiThinking || currentPlayer === 'yellow') ? 'none' : 'auto',
          opacity: aiThinking ? 0.7 : 1,
          transition: 'opacity 0.2s'
        }}>
          <Board />
        </div>

        {/* Buttons */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleNewRound}
            size="large"
            disabled={status === 'playing'}
          >
            Nächste Runde
          </Button>
          <Button
            icon={<RobotOutlined />}
            onClick={handleNewSession}
            size="large"
          >
            Neue Session
          </Button>
          <Button
            icon={<HomeOutlined />}
            onClick={handleBack}
            size="large"
          >
            Menü
          </Button>
        </Space>
      </Space>
    </Card>
  )
}

