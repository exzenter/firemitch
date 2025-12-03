import { Form, Input, Button, Alert, Divider } from 'antd'
import { MailOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'

interface LoginFormProps {
  onSwitchToRegister: () => void
}

export const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  const { login, loginWithGoogle, error, loading, clearError } = useAuth()
  const [form] = Form.useForm()

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password)
    } catch {
      // Error is handled in useAuth
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch {
      // Error is handled in useAuth
    }
  }

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item
        name="email"
        rules={[
          { required: true, message: 'Bitte E-Mail eingeben' },
          { type: 'email', message: 'Ungueltige E-Mail' },
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="E-Mail" size="large" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Bitte Passwort eingeben' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Passwort"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Anmelden
        </Button>
      </Form.Item>

      <Divider>oder</Divider>

      <Button
        icon={<GoogleOutlined />}
        onClick={handleGoogleLogin}
        loading={loading}
        block
        size="large"
      >
        Mit Google anmelden
      </Button>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        Noch kein Konto?{' '}
        <Button type="link" onClick={onSwitchToRegister} style={{ padding: 0 }}>
          Jetzt registrieren
        </Button>
      </div>
    </Form>
  )
}

