import { Card, Table, Typography, Empty, Spin } from 'antd'
import { TrophyOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'
import { useOpponentHistory } from '../../hooks/useOpponentHistory'
import { useAuth } from '../../hooks/useAuth'

const { Title, Text } = Typography

export const OpponentHistory = () => {
  const { user } = useAuth()
  const { opponents, loading } = useOpponentHistory(user?.uid)

  const columns = [
    {
      title: 'Gegner',
      dataIndex: 'opponentName',
      key: 'opponentName',
    },
    {
      title: <><TrophyOutlined style={{ color: '#52c41a' }} /> Siege</>,
      dataIndex: 'wins',
      key: 'wins',
      render: (wins: number) => <Text type="success">{wins}</Text>,
    },
    {
      title: <><CloseCircleOutlined style={{ color: '#f5222d' }} /> Niederlagen</>,
      dataIndex: 'losses',
      key: 'losses',
      render: (losses: number) => <Text type="danger">{losses}</Text>,
    },
    {
      title: <><MinusCircleOutlined /> Unentschieden</>,
      dataIndex: 'draws',
      key: 'draws',
    },
    {
      title: 'Bilanz',
      key: 'record',
      render: (_: unknown, record: { wins: number; losses: number }) => {
        const diff = record.wins - record.losses
        return (
          <Text type={diff > 0 ? 'success' : diff < 0 ? 'danger' : undefined}>
            {diff > 0 ? '+' : ''}{diff}
          </Text>
        )
      },
    },
    {
      title: 'Zuletzt gespielt',
      dataIndex: 'lastPlayed',
      key: 'lastPlayed',
      render: (date: Date) => date.toLocaleDateString('de-DE'),
    },
  ]

  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    )
  }

  return (
    <Card title={<Title level={4}>Gegner-Historie</Title>}>
      {opponents.length === 0 ? (
        <Empty description="Noch keine Online-Spiele gespielt" />
      ) : (
        <Table
          dataSource={opponents}
          columns={columns}
          rowKey="odg"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      )}
    </Card>
  )
}

