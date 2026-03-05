import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Skeleton,
} from '@mui/material'
import { PlayArrow as PlayIcon } from '@mui/icons-material'
import { useQuiz } from '../hooks/useQuiz'
import type { Quiz } from '../types'

export default function Home() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { fetchPublicQuizzes } = useQuiz()

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    setLoading(true)
    const { data, error: fetchError } = await fetchPublicQuizzes()
    if (fetchError) {
      setError(fetchError)
    } else if (data) {
      setQuizzes(data as Quiz[])
    }
    setLoading(false)
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Публичные викторины
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Пройдите викторину и проверьте свои знания!
      </Typography>

      <Grid container spacing={3}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="80%" height={32} />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : quizzes.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  Публичные викторины пока недоступны
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/login')}
                >
                  Создать первую викторину
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          quizzes.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {quiz.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {quiz.description || 'Описание отсутствует'}
                  </Typography>
                  <Chip
                    label={`${(quiz as any).questions?.[0]?.count || 0} вопросов`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayIcon />}
                    onClick={() => navigate(`/quiz/${quiz.id}`)}
                  >
                    Пройти викторину
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  )
}
