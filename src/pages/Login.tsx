import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
} from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)

      if (error) {
        setError(error.message)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
        setLoading(false)
      }
    } catch (err) {
      setError('Произошла непредвиденная ошибка')
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            {isSignUp ? 'Создать аккаунт' : 'Войти'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleSignIn}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            Войти через Google
          </Button>

          <Divider sx={{ my: 2 }}>или</Divider>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              disabled={loading}
              helperText={isSignUp ? 'Пароль должен содержать минимум 6 символов' : ''}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? 'Загрузка...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              {isSignUp ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
              <Button
                color="primary"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError('')
                }}
              >
                {isSignUp ? 'Войти' : 'Зарегистрироваться'}
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
