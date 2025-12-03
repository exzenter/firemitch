import { Card, Space, Typography, Button, Tag } from 'antd'
import { ReloadOutlined, TrophyOutlined } from '@ant-design/icons'
import { useGameStore } from '../stores/gameStore'
import { Board } from './Board'
import { COLS } from '../types/game'

const { Title, Text } = Typography

export const Game = () => {
  const { currentPlayer, winner, status, resetGame } = useGameStore()

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
                {winner === 'red' ? 'ROT' : 'GELB'}
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
              {currentPlayer === 'red' ? 'ROT' : 'GELB'}
            </Tag>
          </Space>
        )
      default:
        return null
    }
  }

  return (
    <Card
      style={{
        background: 'rgba(26, 26, 46, 0.9)',
        border: '1px solid rgba(245, 34, 45, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}
      bodyStyle={{ padding: '32px' }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title
            level={4}
            style={{
              color: '#e4e4e7',
              margin: 0,
              marginBottom: '16px',
              fontWeight: 500,
            }}
          >
            {getStatusMessage()}
          </Title>
        </div>

        <Board />

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={resetGame}
            size="large"
            style={{
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Neues Spiel
          </Button>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Text style={{ color: '#71717a', fontSize: '12px' }}>
            {COLS} Spalten × 6 Reihen
          </Text>
          <Text style={{ color: '#71717a', fontSize: '12px' }}>
            4 in einer Reihe zum Gewinnen
          </Text>
        </div>
      </Space>
    </Card>
  )
}

