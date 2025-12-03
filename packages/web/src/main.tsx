import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider, theme } from 'antd'
import deDE from 'antd/locale/de_DE'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={deDE}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#f5222d',
            colorBgContainer: '#1a1a2e',
            colorBgLayout: '#0f0f1a',
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
        <App />
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
)

