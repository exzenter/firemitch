import { useState, useEffect } from 'react'
import { Layout, Typography, Button, Space, Spin } from 'antd'
import { GithubOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { Game } from './components/Game'
import { ModeSelect } from './components/ModeSelect'
import { Matchmaking } from './components/Matchmaking'
import { OnlineGame } from './components/OnlineGame'
import { AuthModal } from './components/Auth'
import { useAuth } from './hooks/useAuth'
import { onAuthChange, getUserProfile } from './lib/auth'
import { useAuthStore } from './stores/authStore'

const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

type AppView = 'mode-select' | 'local-game' | 'matchmaking' | 'online-game'

function App() {
  const [view, setView] = useState<AppView>('mode-select')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null)
  const { user, profile, loading, logout } = useAuth()
  const { setUser, setProfile, setLoading } = useAuthStore()

  // Sync auth state to store
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [setUser, setProfile, setLoading])

  const handleSelectLocal = () => {
    setView('local-game')
  }

  const handleSelectOnline = () => {
    if (user) {
      setView('matchmaking')
    } else {
      setShowAuthModal(true)
    }
  }

  const handleGameFound = (gameId: string) => {
    setOnlineGameId(gameId)
    setView('online-game')
  }

  const handleBackToMenu = () => {
    setView('mode-select')
    setOnlineGameId(null)
  }

  // Close auth modal when user logs in
  useEffect(() => {
    if (user && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [user, showAuthModal])

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(245, 34, 45, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        <Title
          level={2}
          style={{
            margin: 0,
            background: 'linear-gradient(90deg, #f5222d, #faad14)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
          onClick={handleBackToMenu}
        >
          4 GEWINNT
        </Title>
        
        <Space>
          {user && profile ? (
            <>
              <Text style={{ color: '#e4e4e7' }}>
                <UserOutlined /> {profile.displayName}
              </Text>
              <Button 
                icon={<LogoutOutlined />} 
                onClick={logout}
                type="text"
                style={{ color: '#e4e4e7' }}
              >
                Abmelden
              </Button>
            </>
          ) : (
            <Button 
              type="primary" 
              onClick={() => setShowAuthModal(true)}
            >
              Anmelden
            </Button>
          )}
        </Space>
      </Header>
      
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          flex: 1,
        }}
      >
        {view === 'mode-select' && (
          <ModeSelect
            onSelectLocal={handleSelectLocal}
            onSelectOnline={handleSelectOnline}
            onShowAuth={() => setShowAuthModal(true)}
          />
        )}
        
        {view === 'local-game' && (
          <div>
            <Button 
              onClick={handleBackToMenu} 
              style={{ marginBottom: 16 }}
            >
              Zurueck zum Menue
            </Button>
            <Game />
          </div>
        )}
        
        {view === 'matchmaking' && (
          <Matchmaking
            onGameFound={handleGameFound}
            onCancel={handleBackToMenu}
          />
        )}
        
        {view === 'online-game' && onlineGameId && (
          <OnlineGame
            gameId={onlineGameId}
            onLeave={handleBackToMenu}
          />
        )}
      </Content>
      
      <Footer
        style={{
          background: 'transparent',
          textAlign: 'center',
          borderTop: '1px solid rgba(245, 34, 45, 0.2)',
          color: '#71717a',
        }}
      >
        <a
          href="https://github.com/exzenter/firemitch"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#71717a', marginRight: '16px' }}
        >
          <GithubOutlined style={{ fontSize: '20px' }} />
        </a>
        Firemitch {new Date().getFullYear()} - Powered by Firebase
      </Footer>
      
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </Layout>
  )
}

export default App
