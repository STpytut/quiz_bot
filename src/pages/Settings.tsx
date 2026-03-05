import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from '@mui/material'
import {
  Telegram as TelegramIcon,
  Link as LinkIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface TelegramLink {
  telegram_id: number
  telegram_username: string | null
  telegram_first_name: string | null
  telegram_last_name: string | null
  email: string | null
  is_verified: boolean
}

export default function Settings() {
  const { user } = useAuth()
  const [telegramLink, setTelegramLink] = useState<TelegramLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBindDialog, setShowBindDialog] = useState(false)
  const [telegramUsername, setTelegramUsername] = useState('')
  const [bindLoading, setBindLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadTelegramLink()
    }
  }, [user])

  const loadTelegramLink = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('telegram_auth_links')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      setTelegramLink(data || null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleBindTelegram = async () => {
    if (!telegramUsername.trim()) {
      setError('Введите Telegram username')
      return
    }

    setBindLoading(true)
    setError(null)

    try {
      const username = telegramUsername.replace('@', '')
      
      // Проверяем, есть ли уже привязка
      const { data: existing } = await supabase
        .from('telegram_auth_links')
        .select('*')
        .eq('user_id', user!.id)
        .single()

      if (existing) {
        // Обновляем существующую запись
        const { error: updateError } = await supabase
          .from('telegram_auth_links')
          .update({
            telegram_username: username,
            is_verified: false,
          })
          .eq('user_id', user!.id)

        if (updateError) throw updateError
      } else {
        // Создаем новую запись (telegram_id будет добавлен позже через бота)
        const { error: insertError } = await supabase
          .from('telegram_auth_links')
          .insert({
            user_id: user!.id,
            telegram_username: username,
            is_verified: false,
          })

        if (insertError) throw insertError
      }

      setShowBindDialog(false)
      setTelegramUsername('')
      loadTelegramLink()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при привязке'
      setError(message)
    } finally {
      setBindLoading(false)
    }
  }

  const handleUnlinkTelegram = async () => {
    if (!confirm('Отвязать Telegram аккаунт?')) return

    try {
      const { error: deleteError } = await supabase
        .from('telegram_auth_links')
        .delete()
        .eq('user_id', user!.id)

      if (deleteError) throw deleteError

      setTelegramLink(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при отвязке'
      setError(message)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Настройки
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Аккаунт
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: {user?.email}
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Telegram аккаунт
            </Typography>
            {telegramLink?.is_verified ? (
              <Chip
                icon={<CheckIcon />}
                label="Привязан"
                color="success"
                size="small"
              />
            ) : telegramLink ? (
              <Chip
                icon={<LinkIcon />}
                label="Ожидает подтверждения"
                color="warning"
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

          {telegramLink?.is_verified ? (
            <Box>
              {telegramLink.telegram_username && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Username: @{telegramLink.telegram_username}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {telegramLink.telegram_first_name} {telegramLink.telegram_last_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Telegram аккаунт привязан. Теперь вы можете входить через Telegram Mini App и видеть те же викторины.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={handleUnlinkTelegram}
              >
                Отвязать Telegram
              </Button>
            </Box>
          ) : telegramLink ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Username: @{telegramLink.telegram_username}
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Для завершения привязки откройте Telegram бота и отправьте команду /link {user?.id}
              </Alert>
              <Button
                variant="outlined"
                color="error"
                onClick={handleUnlinkTelegram}
              >
                Отменить привязку
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Привяжите Telegram аккаунт для входа через Telegram Mini App
              </Typography>
              <Button
                variant="contained"
                startIcon={<TelegramIcon />}
                onClick={() => setShowBindDialog(true)}
              >
                Привязать Telegram
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBindDialog} onClose={() => setShowBindDialog(false)}>
        <DialogTitle>Привязать Telegram</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Введите ваш Telegram username для привязки аккаунта
          </DialogContentText>
          <TextField
            fullWidth
            label="Telegram username"
            placeholder="@username"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            disabled={bindLoading}
            helperText="Например: @myusername или myusername"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBindDialog(false)}>Отмена</Button>
          <Button
            onClick={handleBindTelegram}
            disabled={bindLoading}
            variant="contained"
          >
            {bindLoading ? <CircularProgress size={24} /> : 'Привязать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
