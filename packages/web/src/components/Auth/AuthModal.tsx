import { useState } from 'react'
import { Modal, Tabs } from 'antd'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  return (
    <Modal
      title={activeTab === 'login' ? 'Anmelden' : 'Registrieren'}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'login' | 'register')}
        items={[
          {
            key: 'login',
            label: 'Anmelden',
            children: (
              <LoginForm onSwitchToRegister={() => setActiveTab('register')} />
            ),
          },
          {
            key: 'register',
            label: 'Registrieren',
            children: (
              <RegisterForm onSwitchToLogin={() => setActiveTab('login')} />
            ),
          },
        ]}
      />
    </Modal>
  )
}

