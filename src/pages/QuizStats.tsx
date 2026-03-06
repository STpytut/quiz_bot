import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { useQuiz } from '../hooks/useQuiz'
import type { QuizStats } from '../types'

export default function QuizStats() {
  const [stats, setStats] = useState<QuizStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { fetchQuizStats } = useQuiz()
  const navigate = useNavigate()
  const { id: quizId } = useParams()
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    if (quizId) {
      loadStats(quizId)
    }
  }, [quizId])

  const loadStats = async (id: string) => {
    setLoading(true)
    const { data, error: fetchError } = await fetchQuizStats(id)
    if (fetchError) {
      setError(fetchError)
    } else if (data) {
      setStats(data)
    }
    setLoading(false)
  }

  if (loading) {
    return <Typography>Загрузка статистики...</Typography>
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!stats) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Статистика не найдена
      </Alert>
    )
  }

  const chartData = stats.question_stats.map((q, index) => ({
    name: `Q${index + 1}`,
    percentage: Math.round(q.percentage),
    question: q.question_text,
  }))

  const getBarColor = (percentage: number) => {
    if (percentage >= 70) return '#4caf50'
    if (percentage >= 50) return '#ff9800'
    return '#f44336'
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 4 
      }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mr: { sm: 2 } }}
          size={isMobile ? "small" : "medium"}
        >
          Назад
        </Button>
        <Typography 
          variant="h3" 
          component="h1"
          sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}
        >
          Статистика викторины
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Всего сессий
              </Typography>
              <Typography variant="h2" color="primary" sx={{ fontSize: { xs: '2.5rem', sm: '3.75rem' } }}>
                {stats.total_sessions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Средний балл
              </Typography>
              <Typography variant="h2" color="primary" sx={{ fontSize: { xs: '2.5rem', sm: '3.75rem' } }}>
                {stats.average_score.toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Процент завершения
              </Typography>
              <Typography variant="h2" color="primary" sx={{ fontSize: { xs: '2.5rem', sm: '3.75rem' } }}>
                {stats.completion_rate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Эффективность вопросов
          </Typography>
          <Box sx={{ width: '100%', height: { xs: 300, sm: 400 } }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: isMobile ? 0 : 30, left: isMobile ? -20 : 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: isMobile ? 12 : 14 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: isMobile ? 12 : 14 }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Правильные ответы']}
                  labelFormatter={(label) => {
                    const item = chartData.find((d) => d.name === label)
                    return item?.question || String(label)
                  }}
                />
                <Bar dataKey="percentage" name="Правильные ответы %">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Детали вопросов
          </Typography>
          {stats.question_stats.map((question, index) => (
            <Box
              key={question.question_id}
              sx={{
                py: 2,
                borderBottom: index < stats.question_stats.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                Вопрос {index + 1}: {question.question_text}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                gap: { xs: 1, sm: 2 },
                mt: 1
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: '130px' }}>
                  {question.correct_answers} / {question.total_answers} правильных
                </Typography>
                
                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${question.percentage}%`,
                        height: '100%',
                        bgcolor: getBarColor(question.percentage),
                      }}
                    />
                  </Box>
                  <Typography variant="body2" fontWeight="bold" sx={{ minWidth: '40px', textAlign: 'right' }}>
                    {Math.round(question.percentage)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {stats.participants && stats.participants.length > 0 && (
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
            <Typography variant="h5" gutterBottom sx={{ px: { xs: 1, sm: 0 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Результаты участников
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
              <Table size={isMobile ? "small" : "medium"} sx={{ minWidth: 400 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Участник</strong></TableCell>
                    <TableCell align="center"><strong>Результат</strong></TableCell>
                    <TableCell align="center"><strong>Процент</strong></TableCell>
                    <TableCell align="right"><strong>Дата</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.participants.map((participant) => {
                    const date = participant.completed_at 
                      ? new Date(participant.completed_at).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Не завершено'
                    
                    return (
                      <TableRow key={participant.id}>
                        <TableCell component="th" scope="row">
                          {participant.participant_name || 'Аноним'}
                        </TableCell>
                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                          {participant.score} / {participant.total_questions}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${Math.round(participant.percentage)}%`}
                            size="small"
                            color={
                              participant.percentage >= 70 
                                ? 'success' 
                                : participant.percentage >= 50 
                                  ? 'warning' 
                                  : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" color="text.secondary">
                            {date}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
