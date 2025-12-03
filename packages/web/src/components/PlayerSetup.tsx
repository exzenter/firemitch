import { useState } from 'react'
import { Card, Input, Button, Space, Typography, Divider } from 'antd'
import { UserOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useGameStore } from '../stores/gameStore'

const { Text } = Typography

export const PlayerSetup = () => {
  const [redName, setRedName] = useState('')
  const [yellowName, setYellowName] = useState('')
  const { setPlayers, startGame } = useGameStore()

  const handleStart = () => {
    const player1 = redName.trim() || 'Spieler 1'
    const player2 = yellowName.trim() || 'Spieler 2'
    setPlayers(player1, player2)
    startGame()
  }

  const canStart = true // Namen sind optional

  return (
    <Card title="Neues Spiel starten" style={{ width: 400, maxWidth: '100%' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Text type="secondary">Modus: 1 Gerät, 2 Spieler</Text>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div>
          <Text strong style={{ color: '#f5222d' }}>🔴 Spieler 1 (Rot)</Text>
          <Input
            placeholder="Name eingeben..."
            prefix={<UserOutlined />}
            value={redName}
            onChange={(e) => setRedName(e.target.value)}
            onPressEnter={handleStart}
            style={{ marginTop: 8 }}
          />
        </div>
        
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
        
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStart}
          disabled={!canStart}
          block
          size="large"
        >
          Spiel starten
        </Button>
      </Space>
    </Card>
  )
}

