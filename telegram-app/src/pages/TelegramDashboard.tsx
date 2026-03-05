import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Edit as EditIcon,
  BarChart as StatsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { supabase } from '../lib/supabase'
import { useTelegram } from '../hooks/useTelegram'
import type { User } from '@supabase/supabase-js'

interface Quiz {
  id: string
  title: string
  description: string | null
  is_public: boolean
  created_at: string
  questions?: { count: number }[]
}

export default function TelegramDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const { theme } = useTelegram()

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadQuizzes()
    }
  }, [user])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (!user) {
      setLoading(false)
    }
  }

  const loadQuizzes = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('quizzes')
        .select(`
          *,
          questions (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setQuizzes(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (quizId: string) => {
    if (!confirm('Удалить викторину?')) return

    try {
      const { error: deleteError } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (deleteError) throw deleteError
      setQuizzes(quizzes.filter((q) => q.id !== quizId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления'
      setError(message)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Мои викторины
        </Typography>
        <IconButton onClick={() => navigate('/')}>
          <AddIcon />
        </IconButton>
      </Box>

      {quizzes.length === 0 ? (
        <Card sx={{ backgroundColor: theme.secondaryBgColor }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Вы еще не создали ни одной викторины
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/')}
              sx={{ mt: 2 }}
            >
              Создать первую
            </Button>
          </CardContent>
        </Card>
      ) : (
        quizzes.map((quiz) => (
          <Card key={quiz.id} sx={{ mb: 2, backgroundColor: theme.secondaryBgColor }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {quiz.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {quiz.description || 'Нет описания'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip
                  label={`${quiz.questions?.[0]?.count || 0} вопросов`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={quiz.is_public ? 'Публичная' : 'Приватная'}
                  size="small"
                  color={quiz.is_public ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/edit/${quiz.id}`)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => navigate(`/stats/${quiz.id}`)}
                >
                  <StatsIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(quiz.id)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  )
}
