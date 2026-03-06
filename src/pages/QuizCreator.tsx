import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  Alert,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  RadioButtonChecked as RadioIcon,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { useQuiz } from '../hooks/useQuiz'
import type { CreateQuizInput, CreateQuestionInput, CreateAnswerInput } from '../types'

interface QuestionFormData {
  id: string
  text: string
  answers: AnswerFormData[]
}

interface AnswerFormData {
  id: string
  text: string
  is_correct: boolean
}

export default function QuizCreator() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [questions, setQuestions] = useState<QuestionFormData[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { createQuiz, updateQuiz, fetchQuizById } = useQuiz()
  const navigate = useNavigate()
  const { id: quizId } = useParams()

  useEffect(() => {
    if (quizId) {
      loadQuiz(quizId)
    } else {
      addQuestion()
    }
  }, [quizId])

  const loadQuiz = async (id: string) => {
    setLoading(true)
    const { data, error: fetchError } = await fetchQuizById(id)
    if (fetchError) {
      setError(fetchError)
    } else if (data) {
      setTitle(data.title)
      setDescription(data.description || '')
      setIsPublic(data.is_public)
      setQuestions(
        data.questions.map((q) => ({
          id: q.id,
          text: q.text,
          answers: q.answers.map((a) => ({
            id: a.id,
            text: a.text,
            is_correct: a.is_correct,
          })),
        }))
      )
    }
    setLoading(false)
  }

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      id: `temp-${Date.now()}`,
      text: '',
      answers: [
        { id: `temp-${Date.now()}-1`, text: '', is_correct: true },
        { id: `temp-${Date.now()}-2`, text: '', is_correct: false },
      ],
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (questionIndex: number, text: string) => {
    const updated = [...questions]
    updated[questionIndex].text = text
    setQuestions(updated)
  }

  const deleteQuestion = (questionIndex: number) => {
    if (questions.length === 1) {
      setError('Должен быть хотя бы один вопрос')
      return
    }
    setQuestions(questions.filter((_, i) => i !== questionIndex))
  }

  const addAnswer = (questionIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].answers.push({
      id: `temp-${Date.now()}`,
      text: '',
      is_correct: false,
    })
    setQuestions(updated)
  }

  const updateAnswer = (questionIndex: number, answerIndex: number, text: string) => {
    const updated = [...questions]
    updated[questionIndex].answers[answerIndex].text = text
    setQuestions(updated)
  }

  const deleteAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions]
    if (updated[questionIndex].answers.length === 2) {
      setError('Каждый вопрос должен иметь минимум 2 ответа')
      return
    }
    updated[questionIndex].answers = updated[questionIndex].answers.filter(
      (_, i) => i !== answerIndex
    )
    setQuestions(updated)
  }

  const setCorrectAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions]
    updated[questionIndex].answers.forEach((answer, i) => {
      answer.is_correct = i === answerIndex
    })
    setQuestions(updated)
  }

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Название викторины обязательно'
    if (questions.length === 0) return 'Необходим хотя бы один вопрос'

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      if (!question.text.trim()) return `Текст вопроса ${i + 1} обязателен`
      
      const hasCorrectAnswer = question.answers.some((a) => a.is_correct)
      if (!hasCorrectAnswer) return `Вопрос ${i + 1} должен иметь правильный ответ`

      for (let j = 0; j < question.answers.length; j++) {
        if (!question.answers[j].text.trim()) {
          return `Ответ ${j + 1} в вопросе ${i + 1} обязателен`
        }
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!user) {
      setError('Для создания викторины необходимо войти')
      return
    }

    setLoading(true)

    const quizInput: CreateQuizInput = {
      title,
      description: description || undefined,
      is_public: isPublic,
      questions: questions.map((q, qIndex): CreateQuestionInput => ({
        text: q.text,
        order_index: qIndex,
        answers: q.answers.map((a, aIndex): CreateAnswerInput => ({
          text: a.text,
          is_correct: a.is_correct,
          order_index: aIndex,
        })),
      })),
    }

    if (quizId) {
      const { error: updateError } = await updateQuiz(quizId, quizInput)
      if (updateError) {
        setError(updateError)
      } else {
        navigate('/dashboard')
      }
    } else {
      const { error: createError } = await createQuiz(quizInput, user.id)
      if (createError) {
        setError(createError)
      } else {
        navigate('/dashboard')
      }
    }

    setLoading(false)
  }

  if (loading && quizId) {
    return <Typography>Загрузка викторины...</Typography>
  }

  return (
    <Box>
      <Typography 
        variant="h3" 
        component="h1" 
        gutterBottom
        sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}
      >
        {quizId ? 'Редактировать викторину' : 'Создать викторину'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Название викторины"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label="Сделать викторину публичной"
              sx={{ mt: 2 }}
            />
          </CardContent>
        </Card>

        {questions.map((question, qIndex) => (
          <Card key={question.id} sx={{ mb: { xs: 2, sm: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                <Typography variant="h6">Вопрос {qIndex + 1}</Typography>
                <IconButton
                  onClick={() => deleteQuestion(qIndex)}
                  color="error"
                  title="Удалить вопрос"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                fullWidth
                label="Текст вопроса"
                value={question.text}
                onChange={(e) => updateQuestion(qIndex, e.target.value)}
                margin="normal"
                required
                multiline
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Ответы
              </Typography>
              {question.answers.map((answer, aIndex) => (
                <Box key={answer.id} sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mb: 1, 
                  alignItems: 'center' 
                }}>
                  <IconButton
                    onClick={() => setCorrectAnswer(qIndex, aIndex)}
                    color={answer.is_correct ? 'success' : 'default'}
                    title="Отметить как правильный ответ"
                    size="small"
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <RadioIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    fullWidth
                    size="small"
                    label={`Ответ ${aIndex + 1}`}
                    value={answer.text}
                    onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                    required
                  />
                  <IconButton
                    onClick={() => deleteAnswer(qIndex, aIndex)}
                    color="error"
                    title="Удалить ответ"
                    size="small"
                    sx={{ p: { xs: 0.5, sm: 1 } }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => addAnswer(qIndex)}
                sx={{ mt: 1 }}
                size="small"
              >
                Добавить ответ
              </Button>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addQuestion}
            fullWidth
            sx={{ py: 1.5 }}
          >
            Добавить вопрос
          </Button>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          pb: 4
        }}>
          <Button
            variant="contained"
            type="submit"
            disabled={loading}
            size="large"
            fullWidth
          >
            {loading ? 'Сохранение...' : quizId ? 'Обновить' : 'Создать'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
            size="large"
            fullWidth
          >
            Отмена
          </Button>
        </Box>
      </form>
    </Box>
  )
}
