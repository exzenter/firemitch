// =============================================================================
// APP.TSX - HAUPTKOMPONENTE DER ANWENDUNG
// =============================================================================
// Dies ist die Root-Komponente der React-App.
// Sie verwaltet die Navigation zwischen verschiedenen "Views" (Ansichten)
// und enthält das grundlegende Layout.

import { useState, useEffect } from 'react'

// ANT DESIGN KOMPONENTEN
// Layout: Strukturiert die Seite in Header, Content, Footer
// Typography: Konsistente Text-Stile
import { Layout, Typography, Button, Space, Spin } from 'antd'

// ANT DESIGN ICONS
import { GithubOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'

// UNSERE KOMPONENTEN
import { Game, OnlineGame } from './components/Game'
import { ModeSelect, Matchmaking } from './components/Matchmaking'
import { AuthModal } from './components/Auth'

// UNSERE HOOKS UND UTILS
import { useAuth } from './hooks/useAuth'
import { onAuthChange, getUserProfile } from './lib/auth'
import { useAuthStore } from './stores/authStore'

// -----------------------------------------------------------------------------
// DESTRUCTURING VON ANT DESIGN KOMPONENTEN
// -----------------------------------------------------------------------------
// Layout.Header, Layout.Content, Layout.Footer sind Sub-Komponenten
// Wir destructuren sie für kürzere Schreibweise
const { Header, Content, Footer } = Layout
const { Title, Text } = Typography

// -----------------------------------------------------------------------------
// TYPE ALIAS FÜR VIEWS
// -----------------------------------------------------------------------------
// Union Type für alle möglichen Ansichten der App
// So kann 'view' nur einen dieser 4 Werte haben
type AppView = 'mode-select' | 'local-game' | 'matchmaking' | 'online-game'

// -----------------------------------------------------------------------------
// APP KOMPONENTE
// -----------------------------------------------------------------------------
function App() {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  
  // Aktueller View - welcher "Bildschirm" wird gezeigt?
  const [view, setView] = useState<AppView>('mode-select')
  
  // Auth Modal (Login/Register Popup) anzeigen?
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // ID des aktuellen Online-Spiels (für OnlineGame Komponente)
  const [onlineGameId, setOnlineGameId] = useState<string | null>(null)
  
  // Auth-Daten aus unserem Custom Hook
  const { user, profile, loading, logout } = useAuth()
  
  // Auth Store Setter (für globalen Auth-State)
  const { setUser, setProfile, setLoading } = useAuthStore()

  // ---------------------------------------------------------------------------
  // useEffect: AUTH STATE SYNCHRONISIEREN
  // ---------------------------------------------------------------------------
  // Dieser Effect synchronisiert Firebase Auth mit unserem Store
  
  useEffect(() => {
    // onAuthChange ist ein Firebase Observer
    // Er ruft den Callback bei Auth-Änderungen auf
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      
      if (firebaseUser) {
        // User ist eingeloggt - Profil laden
        const userProfile = await getUserProfile(firebaseUser.uid)
        setProfile(userProfile)
      } else {
        // User ist ausgeloggt
        setProfile(null)
      }
      
      setLoading(false)
    })
    
    // Cleanup: Observer entfernen wenn Komponente unmountet
    return () => unsubscribe()
  }, [setUser, setProfile, setLoading])  // Dependencies Array

  // ---------------------------------------------------------------------------
  // EVENT HANDLERS
  // ---------------------------------------------------------------------------
  
  // Lokales Spiel starten
  const handleSelectLocal = () => {
    setView('local-game')
  }

  // Online Spiel starten (nur wenn eingeloggt)
  const handleSelectOnline = () => {
    if (user) {
      setView('matchmaking')  // Zum Matchmaking
    } else {
      setShowAuthModal(true)  // Login Modal zeigen
    }
  }

  // Callback wenn Online-Spiel gefunden wurde
  const handleGameFound = (gameId: string) => {
    setOnlineGameId(gameId)
    setView('online-game')
  }

  // Zurück zum Hauptmenü
  const handleBackToMenu = () => {
    setView('mode-select')
    setOnlineGameId(null)
  }

  // ---------------------------------------------------------------------------
  // useEffect: AUTH MODAL SCHLIEßEN NACH LOGIN
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Wenn User eingeloggt ist UND Modal offen, schließen
    if (user && showAuthModal) {
      setShowAuthModal(false)
    }
  }, [user, showAuthModal])

  // ---------------------------------------------------------------------------
  // CONDITIONAL RENDERING: LOADING STATE
  // ---------------------------------------------------------------------------
  // Zeige Spinner während Auth geladen wird
  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    )
  }

  // ---------------------------------------------------------------------------
  // HAUPTRENDERER
  // ---------------------------------------------------------------------------
  return (
    // ANT DESIGN LAYOUT
    // Layout ist ein Container der Header, Content und Footer strukturiert
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      
      {/* ===== HEADER ===== */}
      <Header
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',  // Glaseffekt
          borderBottom: '1px solid rgba(245, 34, 45, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
      >
        {/* LOGO / TITEL */}
        <Title
          level={2}  // h2 Tag
          style={{
            margin: 0,
            // Gradient Text mit CSS
            background: 'linear-gradient(90deg, #f5222d, #faad14)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            letterSpacing: '2px',
            cursor: 'pointer',
          }}
          onClick={handleBackToMenu}  // Klick auf Logo = zurück zum Menü
        >
          4 GEWINNT
        </Title>
        
        {/* USER INFO / AUTH BUTTONS */}
        {/* Space ist ein Flex-Container mit Abständen */}
        <Space>
          {/* CONDITIONAL RENDERING mit Ternary Operator */}
          {/* Wenn user UND profile, zeige User-Info, sonst Login-Button */}
          {user && profile ? (
            // FRAGMENT <>...</> gruppiert Elemente ohne extra DOM-Element
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
      
      {/* ===== CONTENT ===== */}
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          flex: 1,  // Nimmt verfügbaren Platz
        }}
      >
        {/* VIEW SWITCHING */}
        {/* Basierend auf 'view' State zeigen wir verschiedene Komponenten */}
        
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
        
        {/* && Operator mit zusätzlicher Bedingung */}
        {/* Beide Bedingungen müssen true sein */}
        {view === 'online-game' && onlineGameId && (
          <OnlineGame
            gameId={onlineGameId}
            onLeave={handleBackToMenu}
          />
        )}
      </Content>
      
      {/* ===== FOOTER ===== */}
      <Footer
        style={{
          background: 'transparent',
          textAlign: 'center',
          borderTop: '1px solid rgba(245, 34, 45, 0.2)',
          color: '#71717a',
        }}
      >
        {/* EXTERNER LINK */}
        {/* target="_blank" öffnet neuen Tab */}
        {/* rel="noopener noreferrer" ist Sicherheitsmaßnahme */}
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
      
      {/* AUTH MODAL */}
      {/* Modal ist ein Popup-Fenster für Login/Register */}
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </Layout>
  )
}

// DEFAULT EXPORT
// Eine Datei kann nur einen default export haben
// Import: import App from './App' (ohne geschweifte Klammern)
export default App
