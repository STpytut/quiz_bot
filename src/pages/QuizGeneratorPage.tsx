import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, CircularProgress, Box } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import QuizGenerator from '../components/QuizGenerator/QuizGenerator'

export default function QuizGeneratorPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!user) {
    return null
  }

  if (!import.meta.env.VITE_OPENROUTER_API_KEY) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Ключ OpenRouter API не настроен. Добавьте VITE_OPENROUTER_API_KEY в файл .env
      </Alert>
    )
  }

  return <QuizGenerator />
}
