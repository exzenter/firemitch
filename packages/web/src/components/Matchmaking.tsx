import { useEffect } from 'react'
import { Card, Button, Typography, Spin, Space, Alert } from 'antd'
import { SearchOutlined, CloseOutlined } from '@ant-design/icons'
import { useMatchmaking } from '../hooks/useMatchmaking'
import { useAuth } from '../hooks/useAuth'

const { Title, Text } = Typography

interface MatchmakingProps {
  onGameFound: (gameId: string) => void
  onCancel: () => void
}

export const Matchmaking = ({ onGameFound, onCancel }: MatchmakingProps) => {
  const { user, profile } = useAuth()
  const { isSearching, gameId, error, joinQueue, leaveQueue } = useMatchmaking(
    user?.uid,
    profile?.displayName
  )

  useEffect(() => {
    if (gameId) {
      onGameFound(gameId)
    }
  }, [gameId, onGameFound])

  useEffect(() => {
    // Auto-join queue when component mounts
    if (user && profile && !isSearching && !gameId) {
      joinQueue()
    }
    
    // Leave queue when component unmounts
    return () => {
      if (isSearching) {
        leaveQueue()
      }
    }
  }, [])

  const handleCancel = async () => {
    await leaveQueue()
    onCancel()
  }

  return (
    <Card style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3}>Online Matchmaking</Title>
          <Text type="secondary">Spiele als: {profile?.displayName}</Text>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon />
        )}

        <div style={{ padding: '32px 0' }}>
          <Spin size="large" spinning={isSearching} />
          <div style={{ marginTop: 16 }}>
            {isSearching ? (
              <>
                <SearchOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Title level={4}>Suche Gegner...</Title>
                <Text type="secondary">
                  Warte auf einen anderen Spieler
                </Text>
              </>
            ) : (
              <>
                <Title level={4}>Bereit zum Spielen</Title>
                <Button type="primary" onClick={joinQueue} size="large">
                  Gegner suchen
                </Button>
              </>
            )}
          </div>
        </div>

        <Button 
          icon={<CloseOutlined />} 
          onClick={handleCancel}
          danger
        >
          Abbrechen
        </Button>
      </Space>
    </Card>
  )
}

