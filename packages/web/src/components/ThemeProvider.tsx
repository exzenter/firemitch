// =============================================================================
// THEME PROVIDER KOMPONENTE
// =============================================================================
// Wrapper-Komponente die das Theme aus dem Store liest und an Ant Design weitergibt.

import { useEffect } from 'react'
import { ConfigProvider, theme as antdTheme } from 'antd'
import deDE from 'antd/locale/de_DE'
import { useThemeStore } from '../stores/themeStore'

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const currentTheme = useThemeStore((state) => state.theme)

  // Body-Klasse für CSS-Styles setzen
  useEffect(() => {
    if (currentTheme === 'light') {
      document.body.classList.add('light-mode')
      document.body.classList.remove('dark-mode')
    } else {
      document.body.classList.add('dark-mode')
      document.body.classList.remove('light-mode')
    }
  }, [currentTheme])

  const isDark = currentTheme === 'dark'

  return (
    <ConfigProvider
      locale={deDE}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#f5222d',
          colorBgContainer: isDark ? '#1a1a2e' : '#ffffff',
          colorBgLayout: isDark ? '#0f0f1a' : '#f5f5f5',
          borderRadius: 8,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        components: {
          Button: {
            primaryShadow: '0 4px 14px rgba(245, 34, 45, 0.4)',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}

