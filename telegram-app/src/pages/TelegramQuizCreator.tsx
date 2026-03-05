import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  RadioButtonChecked as RadioIcon,
} from '@mui/icons-material'
import { supabase } from '../lib/supabase'
import { useTelegram } from '../hooks/useTelegram'

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

export default function TelegramQuizCreator() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionFormData[]>([
    {
      id: '1',
      text: '',
      answers: [
        { id: '1', text: '', is_correct: true },
        { id: '2', text: '', is_correct: false },
      ],
    },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { theme } = useTelegram()

  const addQuestion = () => {
    const newQuestion: QuestionFormData = {
      id: Date.now().toString(),
      text: '',
      answers: [
        { id: Date.now().toString() + '-1', text: '', is_correct: true },
        { id: Date.now().toString() + '-2', text: '', is_correct: false },
      ],
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, text: string) => {
    const updated = [...questions]
    updated[index].text = text
    setQuestions(updated)
  }

  const deleteQuestion = (index: number) => {
    if (questions.length === 1) {
      setError('Должен быть хотя бы один вопрос')
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const addAnswer = (qIndex: number) => {
    const updated = [...questions]
    updated[qIndex].answers.push({
      id: Date.now().toString(),
      text: '',
      is_correct: false,
    })
    setQuestions(updated)
  }

  const updateAnswer = (qIndex: number, aIndex: number, text: string) => {
    const updated = [...questions]
    updated[qIndex].answers[aIndex].text = text
    setQuestions(updated)
  }

  const deleteAnswer = (qIndex: number, aIndex: number) => {
    const updated = [...questions]
    if (updated[qIndex].answers.length === 2) {
      setError('Каждый вопрос должен иметь минимум 2 ответа')
      return
    }
    updated[qIndex].answers = updated[qIndex].answers.filter((_, i) => i !== aIndex)
    setQuestions(updated)
  }

  const setCorrectAnswer = (qIndex: number, aIndex: number) => {
    const updated = [...questions]
    updated[qIndex].answers.forEach((answer, i) => {
      answer.is_correct = i === aIndex
    })
    setQuestions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Название обязательно')
      return
    }

    if (questions.length === 0) {
      setError('Добавьте хотя бы один вопрос')
      return
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Вопрос ${i + 1} не может быть пустым`)
        return
      }
      if (!questions[i].answers.some((a) => a.is_correct)) {
        setError(`Вопрос ${i + 1} должен иметь правильный ответ`)
        return
      }
      for (let j = 0; j < questions[i].answers.length; j++) {
        if (!questions[i].answers[j].text.trim()) {
          setError(`Ответ ${j + 1} в вопросе ${i + 1} не может быть пустым`)
          return
        }
      }
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title,
          description: description || null,
          is_public: false,
          user_id: user.id,
        })
        .select()
        .single()

      if (quizError) throw quizError

      for (const [qIndex, question] of questions.entries()) {
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quiz.id,
            text: question.text,
            order_index: qIndex,
          })
          .select()
          .single()

        if (questionError) throw questionError

        const { error: answersError } = await supabase.from('answers').insert(
          question.answers.map((answer, aIndex) => ({
            question_id: questionData.id,
            text: answer.text,
            is_correct: answer.is_correct,
            order_index: aIndex,
          }))
        )

        if (answersError) throw answersError
      }

      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сохранения'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Создать викторину
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2, backgroundColor: theme.secondaryBgColor }}>
        <CardContent>
          <TextField
            fullWidth
            label="Название"
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
        </CardContent>
      </Card>

      {questions.map((question, qIndex) => (
        <Card key={question.id} sx={{ mb: 2, backgroundColor: theme.secondaryBgColor }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Вопрос {qIndex + 1}</Typography>
              <IconButton onClick={() => deleteQuestion(qIndex)} color="error">
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
            />
            {question.answers.map((answer, aIndex) => (
              <Box key={answer.id} sx={{ display: 'flex', gap: 1, mb: 1, mt: 1 }}>
                <IconButton
                  onClick={() => setCorrectAnswer(qIndex, aIndex)}
                  color={answer.is_correct ? 'success' : 'default'}
                >
                  <RadioIcon />
                </IconButton>
                <TextField
                  fullWidth
                  size="small"
                  label={`Ответ ${aIndex + 1}`}
                  value={answer.text}
                  onChange={(e) => updateAnswer(qIndex, aIndex, e.target.value)}
                  required
                />
                <IconButton onClick={() => deleteAnswer(qIndex, aIndex)} color="error">
                  <DeleteIcon />
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

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={addQuestion}
        fullWidth
        sx={{ mb: 2 }}
      >
        Добавить вопрос
      </Button>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          type="submit"
          disabled={loading}
          fullWidth
          size="large"
          sx={{
            backgroundColor: theme.buttonColor,
            color: theme.buttonTextColor,
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Сохранить'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/dashboard')}
          fullWidth
          size="large"
        >
          Отмена
        </Button>
      </Box>
    </Box>
  )
}
