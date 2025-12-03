import { Card, Space, Typography, Button, Tag, Spin, Alert, Row, Col } from 'antd'
import { 
  TrophyOutlined, 
  HomeOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useOnlineGame } from '../hooks/useOnlineGame'
import { useAuth } from '../hooks/useAuth'
import { Board } from './Board'
import { useGameStore } from '../stores/gameStore'
import { useEffect } from 'react'

const { Title, Text } = Typography

interface OnlineGameProps {
  gameId: string
  onLeave: () => void
}

export const OnlineGame = ({ gameId, onLeave }: OnlineGameProps) => {
  const { user } = useAuth()
  const { 
    gameState, 
    loading, 
    error, 
    myColor, 
    isMyTurn, 
    makeMove,
    leaveGame,
  } = useOnlineGame(gameId, user?.uid)

  useEffect(() => {
    if (gameState) {
      useGameStore.setState({
        board: gameState.board,
        currentPlayer: gameState.currentPlayer,
        winner: gameState.winner,
        winningCells: gameState.winningCells,
        status: gameState.status === 'playing' ? 'playing' : 
                gameState.status === 'won' ? 'won' : 
                gameState.status === 'draw' ? 'draw' : 'waiting',
        players: {
          red: gameState.playerNames.red,
          yellow: gameState.playerNames.yellow,
        },
      })
    }
  }, [gameState])

  const handleColumnClick = async (col: number) => {
    if (!isMyTurn) return
    await makeMove(col)
  }

  // Override dropPiece for online
  useEffect(() => {
    useGameStore.setState({
      dropPiece: handleColumnClick as unknown as (col: number) => boolean,
    })
  }, [isMyTurn])

  const handleLeave = async () => {
    await leaveGame()
    onLeave()
  }

  if (loading) {
    return (
      <Card style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Lade Spiel...</div>
      </Card>
    )
  }

  if (error || !gameState) {
    return (
      <Card>
        <Alert 
          message="Fehler" 
          description={error || 'Spiel nicht gefunden'} 
          type="error" 
          showIcon 
        />
        <Button onClick={onLeave} style={{ marginTop: 16 }}>
          Zurueck
        </Button>
      </Card>
    )
  }

  const getStatusMessage = () => {
    if (gameState.status === 'won') {
      const winnerName = gameState.winner === 'red' 
        ? gameState.playerNames.red 
        : gameState.playerNames.yellow
      const isWinner = gameState.winner === myColor
      
      return (
        <Space>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '24px' }} />
          <Text style={{ fontSize: '18px' }}>
            {isWinner ? 'Du hast gewonnen!' : `${winnerName} hat gewonnen!`}
          </Text>
        </Space>
      )
    }
    
    if (gameState.status === 'draw') {
      return <Text style={{ fontSize: '18px' }}>Unentschieden!</Text>
    }
    
    if (gameState.status === 'abandoned') {
      return <Text style={{ fontSize: '18px' }}>Spiel abgebrochen</Text>
    }

    return (
      <Space>
        {isMyTurn ? (
          <>
            <ClockCircleOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: '16px', color: '#52c41a' }}>Du bist dran!</Text>
          </>
        ) : (
          <>
            <ClockCircleOutlined style={{ color: '#faad14' }} />
            <Text style={{ fontSize: '16px' }}>Gegner ist am Zug...</Text>
          </>
        )}
      </Space>
    )
  }

  const isGameOver = gameState.status !== 'playing'

  return (
    <Card
      style={{
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(245, 34, 45, 0.3)',
        borderRadius: '16px',
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Player Info */}
        <Row gutter={16}>
          <Col span={12}>
            <Card 
              size="small" 
              style={{ 
                background: myColor === 'red' ? 'rgba(245, 34, 45, 0.1)' : 'transparent',
                borderColor: gameState.currentPlayer === 'red' ? '#f5222d' : 'transparent',
              }}
            >
              <Space>
                <Tag color="#f5222d">ROT</Tag>
                <UserOutlined />
                <Text>{gameState.playerNames.red}</Text>
                {myColor === 'red' && <Tag color="blue">Du</Tag>}
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card 
              size="small"
              style={{ 
                background: myColor === 'yellow' ? 'rgba(250, 219, 20, 0.1)' : 'transparent',
                borderColor: gameState.currentPlayer === 'yellow' ? '#fadb14' : 'transparent',
              }}
            >
              <Space>
                <Tag color="#fadb14" style={{ color: '#000' }}>GELB</Tag>
                <UserOutlined />
                <Text>{gameState.playerNames.yellow}</Text>
                {myColor === 'yellow' && <Tag color="blue">Du</Tag>}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Status */}
        <div style={{ textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>
            {getStatusMessage()}
          </Title>
        </div>

        {/* Board */}
        <Board />

        {/* Actions */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            icon={<HomeOutlined />}
            onClick={handleLeave}
            size="large"
            danger={!isGameOver}
          >
            {isGameOver ? 'Zurueck zum Menue' : 'Spiel verlassen'}
          </Button>
        </Space>
      </Space>
    </Card>
  )
}

