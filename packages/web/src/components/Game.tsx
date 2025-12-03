import { Card, Space, Typography, Button, Tag, Statistic, Row, Col, Divider } from 'antd'
import { ReloadOutlined, TrophyOutlined, HomeOutlined } from '@ant-design/icons'
import { useGameStore } from '../stores/gameStore'
import { Board } from './Board'
import { PlayerSetup } from './PlayerSetup'

const { Title, Text } = Typography

export const Game = () => {
  const { 
    currentPlayer, 
    winner, 
    status, 
    resetGame, 
    resetSession,
    gameStarted,
    players,
    stats
  } = useGameStore()

  // Zeige Setup-Screen wenn Spiel nicht gestartet
  if (!gameStarted) {
    return <PlayerSetup />
  }

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
        return null
    }
  }

  const totalGames = stats.red + stats.yellow + stats.draws

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
        {/* Session Statistik */}
        <Card size="small" title="Session Statistik">
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

        {/* Spielbrett */}
        <Board />

        {/* Buttons */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={resetGame}
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
