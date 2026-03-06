import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Chip,
  TextField,
} from '@mui/material'
import {
  CheckCircle as CorrectIcon,
  Cancel as IncorrectIcon,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { useQuiz } from '../hooks/useQuiz'
import type { QuizWithDetails, Answer } from '../types'

interface AnswerState {
  selected: string | null
  isCorrect: boolean | null
  showResult: boolean
}

export default function QuizRunner() {
  const [quiz, setQuiz] = useState<QuizWithDetails | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [answerState, setAnswerState] = useState<AnswerState>({
    selected: null,
    isCorrect: null,
    showResult: false,
  })
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [participantName, setParticipantName] = useState('')
  const [nameError, setNameError] = useState('')
  const { user } = useAuth()
  const { fetchQuizById, createSession, submitAnswer, completeSession } = useQuiz()
  const navigate = useNavigate()
  const { id: quizId } = useParams()

  useEffect(() => {
    if (quizId) {
      loadQuiz(quizId)
    }
  }, [quizId])

  useEffect(() => {
    const savedName = localStorage.getItem('quiz_participant_name')
    if (savedName) {
      setParticipantName(savedName)
    }
  }, [])

  const loadQuiz = async (id: string) => {
    setLoading(true)
    const { data, error: fetchError } = await fetchQuizById(id)
    if (fetchError) {
      setError(fetchError)
    } else if (data) {
      setQuiz(data)
      if (user) {
        const { data: session, error: sessionError } = await createSession(id, user.id, user.email?.split('@')[0] || undefined)
        if (sessionError) {
          setError(sessionError)
        } else if (session) {
          setSessionId(session.id)
        }
        setLoading(false)
      } else {
        setShowNameDialog(true)
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const handleStartQuiz = async () => {
    if (!participantName.trim()) {
      setNameError('Введите ваше имя')
      return
    }
    if (participantName.trim().length < 2) {
      setNameError('Имя должно содержать минимум 2 символа')
      return
    }

    localStorage.setItem('quiz_participant_name', participantName.trim())
    setNameError('')
    setShowNameDialog(false)
    setLoading(true)

    if (quizId) {
      const { data: session, error: sessionError } = await createSession(quizId, null, participantName.trim())
      if (sessionError) {
        setError(sessionError)
      } else if (session) {
        setSessionId(session.id)
      }
    }
    setLoading(false)
  }

  const handleAnswerSelect = async (answer: Answer) => {
    if (answerState.showResult || !sessionId) return

    setAnswerState({
      selected: answer.id,
      isCorrect: answer.is_correct,
      showResult: true,
    })

    if (answer.is_correct) {
      setScore(score + 1)
    }

    await submitAnswer(sessionId, quiz!.questions[currentQuestionIndex].id, answer.id, answer.is_correct)
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setAnswerState({
        selected: null,
        isCorrect: null,
        showResult: false,
      })
    } else {
      handleCompleteQuiz()
    }
  }

  const handleCompleteQuiz = async () => {
    if (sessionId) {
      await completeSession(sessionId)
    }
    setCompleted(true)
  }

  if (loading) {
    return <Typography>Загрузка викторины...</Typography>
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    )
  }

  if (!quiz) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Викторина не найдена
      </Alert>
    )
  }

  if (showNameDialog) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto', mt: { xs: 4, sm: 8 } }}>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}>
              {quiz.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Введите ваше имя для участия в викторине
            </Typography>
            {nameError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {nameError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Ваше имя"
              value={participantName}
              onChange={(e) => {
                setParticipantName(e.target.value)
                setNameError('')
              }}
              margin="normal"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleStartQuiz()
                }
              }}
              autoFocus
            />
            <Button
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              onClick={handleStartQuiz}
            >
              Начать викторину
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
              Ваше имя будет показано в статистике результатов
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (completed) {
    const percentage = Math.round((score / quiz.questions.length) * 100)
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 4 } }}>
            <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
              Викторина завершена!
            </Typography>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              Ваш результат
            </Typography>
            <Typography variant="h2" color="primary" gutterBottom sx={{ fontSize: { xs: '3rem', sm: '4rem' } }}>
              {score} / {quiz.questions.length}
            </Typography>
            <Chip
              label={`${percentage}%`}
              color={percentage >= 70 ? 'success' : percentage >= 50 ? 'warning' : 'error'}
              sx={{ fontSize: '1.5rem', py: 3, px: 2 }}
            />
            <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
              <Button variant="contained" onClick={() => navigate('/')} fullWidth>
                На главную
              </Button>
              {user && (
                <Button variant="outlined" onClick={() => navigate('/dashboard')} fullWidth>
                  Мои викторины
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 1, gap: { xs: 1, sm: 0 } }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            {quiz.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}
          </Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mt: { xs: 1, sm: 0 } }} />
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {currentQuestion.text}
          </Typography>
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {currentQuestion.answers.map((answer) => {
              let buttonColor: 'primary' | 'success' | 'error' = 'primary'
              let variant: 'outlined' | 'contained' = 'outlined'
              let icon = null

              if (answerState.showResult) {
                if (answer.is_correct) {
                  buttonColor = 'success'
                  variant = 'contained'
                  icon = <CorrectIcon />
                } else if (answerState.selected === answer.id) {
                  buttonColor = 'error'
                  variant = 'contained'
                  icon = <IncorrectIcon />
                }
              } else if (answerState.selected === answer.id) {
                variant = 'contained'
              }

              return (
                <Button
                  key={answer.id}
                  variant={variant}
                  color={buttonColor}
                  onClick={() => handleAnswerSelect(answer)}
                  disabled={answerState.showResult}
                  size="large"
                  sx={{ 
                    py: 2, 
                    justifyContent: 'flex-start',
                    textAlign: 'left',
                    minHeight: '64px'
                  }}
                  startIcon={icon}
                >
                  {answer.text}
                </Button>
              )
            })}
          </Box>
        </CardContent>
      </Card>

      {answerState.showResult && (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'stretch' }}>
          <Alert
            severity={answerState.isCorrect ? 'success' : 'error'}
            sx={{ flexGrow: 1, flex: 1 }}
          >
            {answerState.isCorrect ? 'Правильно!' : 'Неправильно!'}
          </Alert>
          <Button
            variant="contained"
            size="large"
            onClick={handleNextQuestion}
            sx={{ flexShrink: 0, py: { xs: 2, sm: 'auto' } }}
          >
            {currentQuestionIndex < quiz.questions.length - 1 ? 'Следующий вопрос' : 'Завершить викторину'}
          </Button>
        </Box>
      )}
    </Box>
  )
}
