import { Card, Button, Space, Typography, Row, Col, Badge, Collapse, Table } from 'antd'
import { 
  DesktopOutlined, 
  GlobalOutlined, 
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { useAuth } from '../hooks/useAuth'
import { useOpponentHistory } from '../hooks/useOpponentHistory'

const { Title, Text } = Typography

interface ModeSelectProps {
  onSelectLocal: () => void
  onSelectOnline: () => void
  onShowAuth: () => void
}

export const ModeSelect = ({ onSelectLocal, onSelectOnline, onShowAuth }: ModeSelectProps) => {
  const { user, profile, logout, loading } = useAuth()
  const { opponents } = useOpponentHistory(user?.uid)

  return (
    <Card style={{ maxWidth: 600, width: '100%' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>4 Gewinnt</Title>
          <Text type="secondary">Waehle einen Spielmodus</Text>
        </div>

        {/* User Info */}
        {user && profile && (
          <Card size="small" style={{ background: '#fafafa' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <UserOutlined />
                  <Text strong>{profile.displayName}</Text>
                  <Badge 
                    count={`${profile.stats.wins}W / ${profile.stats.losses}L`} 
                    style={{ backgroundColor: '#52c41a' }}
                  />
                </Space>
              </Col>
              <Col>
                <Button 
                  icon={<LogoutOutlined />} 
                  onClick={logout}
                  loading={loading}
                  size="small"
                >
                  Abmelden
                </Button>
              </Col>
            </Row>
          </Card>
        )}

        <Row gutter={[16, 16]}>
          {/* Local Mode */}
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={onSelectLocal}
              style={{ textAlign: 'center', height: '100%' }}
            >
              <Space direction="vertical">
                <DesktopOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>Lokal</Title>
                <Text type="secondary">2 Spieler, 1 Geraet</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Spielt abwechselnd auf diesem Bildschirm
                </Text>
              </Space>
            </Card>
          </Col>

          {/* Online Mode */}
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={user ? onSelectOnline : onShowAuth}
              style={{ textAlign: 'center', height: '100%' }}
            >
              <Space direction="vertical">
                <GlobalOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Title level={4} style={{ margin: 0 }}>Online</Title>
                <Text type="secondary">2 Spieler, 2 Geraete</Text>
                {!user ? (
                  <Text type="warning" style={{ fontSize: 12 }}>
                    Anmeldung erforderlich
                  </Text>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Finde einen Gegner online
                  </Text>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Stats for logged in users */}
        {user && profile && (
          <Card size="small" title={<><TrophyOutlined /> Deine Statistik</>}>
            <Row gutter={16}>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Text type="success" style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {profile.stats.wins}
                </Text>
                <br />
                <Text type="secondary">Siege</Text>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Text type="danger" style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {profile.stats.losses}
                </Text>
                <br />
                <Text type="secondary">Niederlagen</Text>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
                  {profile.stats.draws}
                </Text>
                <br />
                <Text type="secondary">Unentschieden</Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* Opponent History */}
        {user && opponents.length > 0 && (
          <Collapse 
            items={[{
              key: 'history',
              label: <><HistoryOutlined /> Gegner-Historie ({opponents.length})</>,
              children: (
                <Table
                  dataSource={opponents}
                  columns={[
                    { title: 'Gegner', dataIndex: 'opponentName', key: 'name' },
                    { title: 'Siege', dataIndex: 'wins', key: 'wins', render: (v: number) => <Text type="success">{v}</Text> },
                    { title: 'Niederlagen', dataIndex: 'losses', key: 'losses', render: (v: number) => <Text type="danger">{v}</Text> },
                    { title: 'Bilanz', key: 'diff', render: (_: unknown, r: { wins: number; losses: number }) => {
                      const diff = r.wins - r.losses
                      return <Text type={diff > 0 ? 'success' : diff < 0 ? 'danger' : undefined}>{diff > 0 ? '+' : ''}{diff}</Text>
                    }},
                  ]}
                  rowKey="odg"
                  size="small"
                  pagination={false}
                />
              ),
            }]}
          />
        )}

        {!user && (
          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={onShowAuth}>
              Anmelden fuer Online-Modus und Statistiken
            </Button>
          </div>
        )}
      </Space>
    </Card>
  )
}

