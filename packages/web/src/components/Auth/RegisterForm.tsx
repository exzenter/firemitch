import { useState } from 'react'
import { Form, Input, Button, Alert, Divider } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, GoogleOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { isDisplayNameUnique } from '../../lib/auth'

interface RegisterFormProps {
  onSwitchToLogin: () => void
}

export const RegisterForm = ({ onSwitchToLogin }: RegisterFormProps) => {
  const { register, loginWithGoogle, error, loading, clearError } = useAuth()
  const [form] = Form.useForm()
  const [checkingName, setCheckingName] = useState(false)

  const handleSubmit = async (values: {
    displayName: string
    email: string
    password: string
  }) => {
    try {
      await register(values.email, values.password, values.displayName)
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

  const validateDisplayName = async (_: unknown, value: string) => {
    if (!value || value.length < 3) {
      return Promise.reject('Mindestens 3 Zeichen')
    }
    
    setCheckingName(true)
    try {
      const isUnique = await isDisplayNameUnique(value)
      if (!isUnique) {
        return Promise.reject('Name bereits vergeben')
      }
      return Promise.resolve()
    } finally {
      setCheckingName(false)
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
        name="displayName"
        rules={[
          { required: true, message: 'Bitte Spielername eingeben' },
          { min: 3, message: 'Mindestens 3 Zeichen' },
          { max: 20, message: 'Maximal 20 Zeichen' },
          { validator: validateDisplayName },
        ]}
        hasFeedback
        validateTrigger="onBlur"
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Spielername (einzigartig)"
          size="large"
        />
      </Form.Item>

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
        rules={[
          { required: true, message: 'Bitte Passwort eingeben' },
          { min: 6, message: 'Mindestens 6 Zeichen' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Passwort (min. 6 Zeichen)"
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Bitte Passwort bestaetigen' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }
              return Promise.reject('Passwoerter stimmen nicht ueberein')
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Passwort bestaetigen"
          size="large"
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading || checkingName}
          block
          size="large"
        >
          Registrieren
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
        Mit Google registrieren
      </Button>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        Bereits ein Konto?{' '}
        <Button type="link" onClick={onSwitchToLogin} style={{ padding: 0 }}>
          Jetzt anmelden
        </Button>
      </div>
    </Form>
  )
}

