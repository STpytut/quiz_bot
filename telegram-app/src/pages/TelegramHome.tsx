import { Box, Typography, Button, Card, CardContent } from '@mui/material'
import { Add as AddIcon, AutoAwesome as GenerateIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'

export default function TelegramHome() {
  const navigate = useNavigate()
  const { tgUser, theme } = useTelegram()

    return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        QuizMaster
      </Typography>
      
      <Typography variant="body1" sx={{ mb: 4, opacity: 0.8 }}>
        Добро пожаловать, {tgUser?.first_name || 'Гость'}! Создавайте и проходите викторины
      </Typography>

      <Card sx={{ mb: 2, backgroundColor: theme.secondaryBgColor }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Создать викторину вручную
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
            Добавьте вопросы и ответы вручную
          </Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<AddIcon />}
            onClick={() => navigate('/create')}
            sx={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
          >
            Создать вручную
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2, backgroundColor: theme.secondaryBgColor }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Генератор викторин
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
            Создайте викторину из текста или файла с помощью AI
          </Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<GenerateIcon />}
            onClick={() => navigate('/generate')}
            sx={{
              backgroundColor: theme.buttonColor,
              color: theme.buttonTextColor,
            }}
          >
            Создить из текста
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="outlined"
        fullWidth
        size="large"
        onClick={() => navigate('/dashboard')}
        sx={{ mt: 2, color: theme.textColor }}
      >
        Мои викторины
      </Button>
    </Box>
  )
}

