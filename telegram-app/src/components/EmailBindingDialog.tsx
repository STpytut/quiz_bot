import { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material'
import { useTelegram } from '../hooks/useTelegram'

interface EmailBindingDialogProps {
  onBind: (email: string, password: string) => Promise<void>
  onSignIn: (email: string, password: string) => Promise<void>
  error: string | null
  loading: boolean
}

export default function EmailBindingDialog({
  onBind,
  onSignIn,
  error,
  loading,
}: EmailBindingDialogProps) {
  const [activeTab, setActiveTab] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const { tgUser, theme } = useTelegram()

  const handleSignUp = async () => {
    setLocalError(null)

    if (!email.trim()) {
      setLocalError('Введите email')
      return
    }

    if (!password.trim()) {
      setLocalError('Введите пароль')
      return
    }

    if (password.length < 6) {
      setLocalError('Пароль должен быть минимум 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Пароли не совпадают')
      return
    }

    try {
      await onBind(email, password)
    } catch (err) {
      // Error handled by parent
    }
  }

  const handleSignIn = async () => {
    setLocalError(null)

    if (!email.trim()) {
      setLocalError('Введите email')
      return
    }

    if (!password.trim()) {
      setLocalError('Введите пароль')
      return
    }

    try {
      await onSignIn(email, password)
    } catch (err) {
      // Error handled by parent
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Добро пожаловать, {tgUser?.first_name || 'Гость'}!
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 3, opacity: 0.8 }}>
        Привяжите email для доступа к своим викторинам на всех устройствах
      </Typography>

      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Регистрация" />
        <Tab label="Вход" />
      </Tabs>

      {(error || localError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {localError || error}
        </Alert>
      )}

      {activeTab === 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Подтвердите пароль"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            variant="outlined"
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSignUp}
            disabled={loading}
            sx={{
              mt: 2,
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
              '&:hover': {
                backgroundColor: theme.buttonColor,
                opacity: 0.9,
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Зарегистрироваться'}
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            variant="outlined"
          />
          <TextField
            fullWidth
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            variant="outlined"
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSignIn}
            disabled={loading}
            sx={{
              mt: 2,
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
              '&:hover': {
                backgroundColor: theme.buttonColor,
                opacity: 0.9,
              },
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
          </Button>
        </Box>
      )}

      <Alert severity="info" sx={{ mt: 3 }}>
        Email позволит вам входить в веб-версию и видеть свои викторины на всех устройствах
      </Alert>
    </Box>
  )
}
