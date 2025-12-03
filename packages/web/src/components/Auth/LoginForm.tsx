// =============================================================================
// REACT KOMPONENTE - LoginForm (Anmelde-Formular)
// =============================================================================
// Diese Komponente zeigt ein Formular zum Anmelden mit Email/Passwort
// und einen Google Sign-In Button.

// React Hooks
// (useState wird nicht verwendet, daher nicht importiert)

// Ant Design Komponenten
// Ant Design ist eine UI-Bibliothek mit fertigen, professionellen Komponenten
import { Form, Input, Button, Alert, Divider } from 'antd'

// Ant Design Icons - SVG Icons als React Komponenten
import { MailOutlined, LockOutlined, GoogleOutlined } from '@ant-design/icons'

// Unser Custom Auth Hook
import { useAuth } from '../../hooks/useAuth'

// -----------------------------------------------------------------------------
// PROPS INTERFACE
// -----------------------------------------------------------------------------
// Diese Komponente erwartet eine Callback-Funktion als Prop
interface LoginFormProps {
  onSwitchToRegister: () => void  // Wird aufgerufen wenn User registrieren will
}

// -----------------------------------------------------------------------------
// DIE KOMPONENTE
// -----------------------------------------------------------------------------
export const LoginForm = ({ onSwitchToRegister }: LoginFormProps) => {
  // ---------------------------------------------------------------------------
  // HOOKS
  // ---------------------------------------------------------------------------
  
  // useAuth gibt uns Funktionen und State für Authentifizierung
  // Wir destructuren nur was wir brauchen
  const { login, loginWithGoogle, error, loading, clearError } = useAuth()
  
  // ANT DESIGN FORM HOOK
  // Form.useForm() erstellt eine Form-Instanz für programmatische Kontrolle
  // TypeScript: form hat den Typ FormInstance
  const [form] = Form.useForm()

  // ---------------------------------------------------------------------------
  // EVENT HANDLER
  // ---------------------------------------------------------------------------
  
  // ASYNC FORM SUBMIT HANDLER
  // Der Parameter 'values' enthält alle Formular-Werte
  // TypeScript: Wir definieren den Typ inline mit { email: string; password: string }
  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password)
      // Bei Erfolg: Komponente wird durch Auth-State-Änderung aktualisiert
    } catch {
      // Fehler wird im useAuth Hook behandelt
      // Leerer catch Block weil wir den Fehler dort schon speichern
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch {
      // Fehler wird im useAuth Hook behandelt
    }
  }

  // ---------------------------------------------------------------------------
  // JSX / RENDERING
  // ---------------------------------------------------------------------------
  
  return (
    // ANT DESIGN FORM KOMPONENTE
    // form={form} verbindet die Form-Instanz
    // onFinish wird aufgerufen wenn das Formular validiert und abgeschickt wird
    // layout="vertical" stapelt Labels über Inputs
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      
      {/* CONDITIONAL RENDERING mit && */}
      {/* Wenn error truthy ist, zeige Alert */}
      {/* Das ist kürzer als: error ? <Alert.../> : null */}
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

      {/* FORM.ITEM - Wrapper für Form-Felder */}
      {/* name="email" verbindet das Feld mit dem Form-State */}
      {/* rules ist ein Array von Validierungsregeln */}
      <Form.Item
        name="email"
        rules={[
          // required: true macht das Feld erforderlich
          { required: true, message: 'Bitte E-Mail eingeben' },
          // type: 'email' prüft ob es eine gültige E-Mail ist
          { type: 'email', message: 'Ungueltige E-Mail' },
        ]}
      >
        {/* ANT DESIGN INPUT */}
        {/* prefix zeigt ein Icon vor dem Input */}
        <Input prefix={<MailOutlined />} placeholder="E-Mail" size="large" />
      </Form.Item>

      {/* PASSWORD FIELD */}
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Bitte Passwort eingeben' }]}
      >
        {/* Input.Password zeigt automatisch einen "Auge"-Toggle */}
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Passwort"
          size="large"
        />
      </Form.Item>

      {/* SUBMIT BUTTON */}
      <Form.Item>
        {/* htmlType="submit" macht den Button zum Form-Submit-Button */}
        {/* loading={loading} zeigt einen Spinner während des Ladens */}
        {/* block macht den Button full-width */}
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Anmelden
        </Button>
      </Form.Item>

      {/* DIVIDER - Trennlinie mit Text */}
      <Divider>oder</Divider>

      {/* GOOGLE LOGIN BUTTON */}
      <Button
        icon={<GoogleOutlined />}  // Icon als Prop
        onClick={handleGoogleLogin}
        loading={loading}
        block
        size="large"
      >
        Mit Google anmelden
      </Button>

      {/* LINK ZUR REGISTRIERUNG */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        Noch kein Konto?{' '}
        {/* Button mit type="link" sieht aus wie ein Link */}
        <Button type="link" onClick={onSwitchToRegister} style={{ padding: 0 }}>
          Jetzt registrieren
        </Button>
      </div>
    </Form>
  )
}
