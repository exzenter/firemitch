import { Layout, Typography } from 'antd'
import { GithubOutlined } from '@ant-design/icons'
import { Game } from './components/Game'

const { Header, Content, Footer } = Layout
const { Title } = Typography

function App() {
  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        style={{
          background: 'rgba(26, 26, 46, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(245, 34, 45, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
          }}
        >
          4 GEWINNT
        </Title>
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
        <Game />
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
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#71717a', marginRight: '16px' }}
        >
          <GithubOutlined style={{ fontSize: '20px' }} />
        </a>
        Firemitch © {new Date().getFullYear()} - Powered by Firebase
      </Footer>
    </Layout>
  )
}

export default App

