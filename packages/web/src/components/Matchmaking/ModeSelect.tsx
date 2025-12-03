// =============================================================================
// REACT KOMPONENTE - ModeSelect (Modus-Auswahl)
// =============================================================================
// Der Startbildschirm der App.
// Zeigt zwei Karten: Lokal spielen vs Online spielen.
// Zeigt auch User-Info und Statistiken wenn eingeloggt.

import { Card, Button, Space, Typography, Row, Col, Badge, Collapse, Table } from 'antd'
import { 
  DesktopOutlined,    // Icon für lokales Spiel
  GlobalOutlined,     // Icon für Online-Spiel
  RobotOutlined,      // Icon für KI-Spiel
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  HistoryOutlined,
} from '@ant-design/icons'

// HOOKS
import { useAuth } from '../../hooks/useAuth'
import { useOpponentHistory } from '../../hooks/useOpponentHistory'

const { Title, Text } = Typography

// -----------------------------------------------------------------------------
// PROPS INTERFACE
// -----------------------------------------------------------------------------
// Diese Komponente erwartet 3 Callback-Funktionen von der Parent-Komponente

interface ModeSelectProps {
  onSelectLocal: () => void   // Wird aufgerufen wenn "Lokal" gewählt wird
  onSelectOnline: () => void  // Wird aufgerufen wenn "Online" gewählt wird
  onSelectAI: () => void      // Wird aufgerufen wenn "KI" gewählt wird
  onShowAuth: () => void      // Wird aufgerufen wenn Auth-Modal gezeigt werden soll
}

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
export const ModeSelect = ({ onSelectLocal, onSelectOnline, onSelectAI, onShowAuth }: ModeSelectProps) => {
  // Auth-Daten aus Hook
  const { user, profile, logout, loading } = useAuth()
  
  // Gegner-Historie laden (nur wenn eingeloggt)
  // Optional Chaining: user?.uid ist undefined wenn user null ist
  const { opponents } = useOpponentHistory(user?.uid)

  return (
    <Card style={{ maxWidth: 600, width: '100%' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* ===== HEADER ===== */}
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>4 Gewinnt</Title>
          <Text type="secondary">Waehle einen Spielmodus</Text>
        </div>

        {/* ===== USER INFO (wenn eingeloggt) ===== */}
        {/* CONDITIONAL RENDERING: Nur zeigen wenn user UND profile existieren */}
        {user && profile && (
          <Card size="small" style={{ background: '#fafafa' }}>
            {/* Row mit justify="space-between" schiebt Kinder an die Enden */}
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <UserOutlined />
                  <Text strong>{profile.displayName}</Text>
                  {/* Badge zeigt kleine Info-Labels */}
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

        {/* ===== MODUS-AUSWAHL KARTEN ===== */}
        <Row gutter={[16, 16]}>  {/* gutter = Abstände zwischen Spalten */}
          
          {/* --- LOKAL MODUS --- */}
          <Col xs={24} sm={12}>  {/* xs=24 (volle Breite mobil), sm=12 (halbe Breite desktop) */}
            <Card
              hoverable  // Hover-Effekt aktivieren
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

          {/* --- ONLINE MODUS --- */}
          <Col xs={24} sm={12}>
            <Card
              hoverable
              // CONDITIONAL HANDLER
              // Wenn user existiert: Online gehen, sonst Auth zeigen
              onClick={user ? onSelectOnline : onShowAuth}
              style={{ textAlign: 'center', height: '100%' }}
            >
              <Space direction="vertical">
                <GlobalOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <Title level={4} style={{ margin: 0 }}>Online</Title>
                <Text type="secondary">2 Spieler, 2 Geraete</Text>
                {/* Unterschiedlicher Text je nach Login-Status */}
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

          {/* --- KI MODUS --- */}
          {/* Volle Breite (xs=24) - so breit wie Lokal und Online zusammen */}
          <Col xs={24}>
            <Card
              hoverable
              onClick={onSelectAI}
              style={{ textAlign: 'center' }}
            >
              <Space direction="vertical">
                <RobotOutlined style={{ fontSize: 48, color: '#722ed1' }} />
                <Title level={4} style={{ margin: 0 }}>Gegen KI</Title>
                <Text type="secondary">1 Spieler vs Computer</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Fordere die clevere Minimax-KI heraus!
                </Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* ===== STATISTIK (wenn eingeloggt) ===== */}
        {user && profile && (
          <Card size="small" title={<><TrophyOutlined /> Deine Statistik</>}>
            <Row gutter={16}>
              <Col span={8} style={{ textAlign: 'center' }}>
                {/* Text mit type="success" ist grün */}
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

        {/* ===== GEGNER-HISTORIE (wenn vorhanden) ===== */}
        {/* .length > 0 prüft ob Array Elemente hat */}
        {user && opponents.length > 0 && (
          // Collapse ist ein Akkordeon-Element
          <Collapse 
            items={[{
              key: 'history',
              // Template Literal für dynamischen Label-Text
              label: <><HistoryOutlined /> Gegner-Historie ({opponents.length})</>,
              children: (
                // ANT DESIGN TABLE
                // Zeigt Daten in einer Tabelle
                <Table
                  dataSource={opponents}  // Die Daten
                  columns={[  // Spalten-Definition
                    { title: 'Gegner', dataIndex: 'opponentName', key: 'name' },
                    { 
                      title: 'Siege', 
                      dataIndex: 'wins', 
                      key: 'wins', 
                      // render erlaubt custom JSX für Zellen
                      render: (v: number) => <Text type="success">{v}</Text> 
                    },
                    { 
                      title: 'Niederlagen', 
                      dataIndex: 'losses', 
                      key: 'losses', 
                      render: (v: number) => <Text type="danger">{v}</Text> 
                    },
                    { 
                      title: 'Bilanz', 
                      key: 'diff', 
                      // render mit zwei Parametern: value, record (ganze Zeile)
                      render: (_: unknown, r: { wins: number; losses: number }) => {
                        const diff = r.wins - r.losses
                        return (
                          <Text type={diff > 0 ? 'success' : diff < 0 ? 'danger' : undefined}>
                            {diff > 0 ? '+' : ''}{diff}
                          </Text>
                        )
                      }
                    },
                  ]}
                  rowKey="odg"  // Eindeutiger Schlüssel für jede Zeile
                  size="small"
                  pagination={false}  // Keine Seitennavigation
                />
              ),
            }]}
          />
        )}

        {/* ===== LOGIN-HINWEIS (wenn nicht eingeloggt) ===== */}
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
