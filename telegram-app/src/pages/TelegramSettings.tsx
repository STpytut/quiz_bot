import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  IconButton,
} from '@mui/material'
import {
  Email as EmailIcon,
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'
import { useTelegram } from '../hooks/useTelegram'
import { useTelegramAuth } from '../hooks/useTelegramAuth'
import { supabase } from '../lib/supabase'

export default function TelegramSettings() {
  const navigate = useNavigate()
  const { tgUser, theme } = useTelegram()
  const { user, signOut } = useTelegramAuth()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const hasEmail = user?.email && !user.email.includes('@quizmaster.virtual')

  const handleBindEmail = async () => {
    setError(null)
    setSuccess(false)

    if (!email.trim()) {
      setError('Введите email')
      return
    }

    if (!password.trim() || password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    setLoading(true)

    try {
      // Вместо создания нового аккаунта, обновляем email в текущем
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
        password: password,
      })

      if (updateError) {
        // Если email уже занят, пробуем войти
        if (updateError.message.includes('already registered')) {
          // Пробуем войти с этим email
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          })
          
          if (signInError) {
            setError('Этот email уже зарегистрирован. Попробуйте войти с этим email в web-версии и привязать Telegram оттуда.')
            setLoading(false)
            return
          }
        } else {
          throw updateError
        }
      }

      setSuccess(true)
      setShowEmailForm(false)
      setEmail('')
      setPassword('')
      
      // Обновляем страницу через 2 секунды
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при привязке email'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: theme.textColor }}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.textColor }}>
          Настройки
        </Typography>
      </Box>

      <Card sx={{ mb: 3, backgroundColor: theme.secondaryBgColor, border: `1px solid ${theme.textColor}20` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: theme.textColor }}>
            Профиль Telegram
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: theme.textColor, opacity: 0.7 }}>
              Имя: {tgUser?.first_name} {tgUser?.last_name}
            </Typography>
            {tgUser?.username && (
              <Typography variant="body2" sx={{ color: theme.textColor, opacity: 0.7 }}>
                Username: @{tgUser.username}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: theme.textColor, opacity: 0.7 }}>
              ID: {tgUser?.id}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3, backgroundColor: theme.secondaryBgColor, border: `1px solid ${theme.textColor}20` }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.textColor }}>
              Email для синхронизации
            </Typography>
            {hasEmail ? (
              <Chip
                icon={<CheckIcon />}
                label="Привязан"
                color="success"
                size="small"
              />
            ) : (
              <Chip
                icon={<LinkIcon />}
                label="Не привязан"
                color="default"
                size="small"
              />
            )}
          </Box>

          {hasEmail ? (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmailIcon sx={{ color: theme.textColor }} />
                <Typography variant="body1" sx={{ color: theme.textColor }}>
                  {user?.email}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: theme.textColor, opacity: 0.7, mb: 2 }}>
                Email привязан. Теперь вы можете входить в веб-версию с тем же email и видеть свои викторины.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowEmailForm(true)}
                sx={{ color: theme.textColor }}
              >
                Изменить email
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ color: theme.textColor, opacity: 0.7, mb: 2 }}>
                Привяжите email для доступа к своим викторинам в веб-версии
              </Typography>
              {!showEmailForm ? (
                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={() => setShowEmailForm(true)}
                  sx={{
                    backgroundColor: theme.buttonColor,
                    color: theme.buttonTextColor,
                  }}
                >
                  Привязать email
                </Button>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      Email успешно привязан!
                    </Alert>
                  )}
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.secondaryBgColor,
                        color: theme.textColor,
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.textColor,
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    helperText="Минимум 6 символов"
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.secondaryBgColor,
                        color: theme.textColor,
                      },
                      '& .MuiInputLabel-root': {
                        color: theme.textColor,
                      },
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleBindEmail}
                      disabled={loading}
                      sx={{
                        backgroundColor: theme.buttonColor,
                        color: theme.buttonTextColor,
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Привязать'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowEmailForm(false)
                        setEmail('')
                        setPassword('')
                        setError(null)
                      }}
                      disabled={loading}
                      sx={{ color: theme.textColor }}
                    >
                      Отмена
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card sx={{ backgroundColor: theme.secondaryBgColor, border: `1px solid ${theme.textColor}20` }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ color: theme.textColor }}>
            Дополнительно
          </Typography>
          <Typography variant="body2" sx={{ color: theme.textColor, opacity: 0.7, mb: 2 }}>
            Выйдите из аккаунта, чтобы переключиться на другого пользователя
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={signOut}
            sx={{ color: '#f44336' }}
          >
            Выйти из аккаунта
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
