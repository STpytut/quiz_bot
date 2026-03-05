import { useState } from 'react'
import {
  Box,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material'
import {
  AutoAwesome as GenerateIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import FileUploader from './FileUploader'
import TextInput from './TextInput'
import QuestionsPreview from './QuestionsPreview'
import { useQuizGenerator } from '../../hooks/useQuizGenerator'
import { useQuiz } from '../../hooks/useQuiz'
import { useAuth } from '../../hooks/useAuth'
import type { CreateQuizInput, CreateQuestionInput, CreateAnswerInput } from '../../types'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function QuizGenerator() {
  const [activeTab, setActiveTab] = useState(0)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const navigate = useNavigate()
  const { user } = useAuth()
  const { createQuiz } = useQuiz()
  const {
    text,
    questionCount,
    generatedQuiz,
    isGenerating,
    error,
    setQuestionCount,
    handleFileUpload,
    handleTextChange,
    handleGenerate,
    updateGeneratedQuestion,
    updateGeneratedAnswer,
    reset,
  } = useQuizGenerator()

  const handleSaveQuiz = async () => {
    if (!generatedQuiz || !user) return

    if (!quizTitle.trim()) {
      setSaveError('Введите название викторины')
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      const quizInput: CreateQuizInput = {
        title: quizTitle,
        description: quizDescription || undefined,
        is_public: false,
        questions: generatedQuiz.questions.map((q, qIndex): CreateQuestionInput => ({
          text: q.text,
          order_index: qIndex,
          answers: q.answers.map((a, aIndex): CreateAnswerInput => ({
            text: a.text,
            is_correct: a.is_correct,
            order_index: aIndex,
          })),
        })),
      }

      const { error: createError } = await createQuiz(quizInput, user.id)
      if (createError) {
        setSaveError(createError)
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setSaveError('Ошибка при сохранении викторины')
    } finally {
      setIsSaving(false)
    }
  }

  const canGenerate = text.trim().length >= 100
  const hasGeneratedQuiz = generatedQuiz && generatedQuiz.questions.length > 0

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h3" component="h1">
          Генератор викторин
        </Typography>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/dashboard')}
        >
          Назад к викторинам
        </Button>
      </Box>

      {!hasGeneratedQuiz ? (
        <>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab label="Вставить текст" />
            <Tab label="Загрузить файл" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <TextInput
              value={text}
              onChange={handleTextChange}
              disabled={isGenerating}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <FileUploader
              onFileUpload={handleFileUpload}
              disabled={isGenerating}
            />
            {text && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Файл загружен! {text.length} символов извлечено.
              </Alert>
            )}
          </TabPanel>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Количество вопросов</InputLabel>
              <Select
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value as number)}
                label="Количество вопросов"
                disabled={isGenerating}
              >
                <MenuItem value={3}>3 вопроса</MenuItem>
                <MenuItem value={5}>5 вопросов</MenuItem>
                <MenuItem value={10}>10 вопросов</MenuItem>
                <MenuItem value={15}>15 вопросов</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="large"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <GenerateIcon />}
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
            >
              {isGenerating ? 'Генерация...' : 'Сгенерировать викторину'}
            </Button>
          </Box>

          {!canGenerate && text.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Минимум 100 символов для генерации. Сейчас: {text.length}
            </Alert>
          )}
        </>
      ) : (
        <>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={reset}
              disabled={isSaving}
            >
              Начать заново
            </Button>
          </Box>

          <QuestionsPreview
            questions={generatedQuiz.questions}
            onUpdateQuestion={updateGeneratedQuestion}
            onUpdateAnswer={updateGeneratedAnswer}
          />

          <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Сохранить викторину
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Название викторины *
                </Typography>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Введите название"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                  disabled={isSaving}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Описание (опционально)
                </Typography>
                <textarea
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="Краткое описание викторины"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '16px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    resize: 'vertical',
                  }}
                  disabled={isSaving}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveQuiz}
                  disabled={!quizTitle.trim() || isSaving}
                >
                  {isSaving ? 'Сохранение...' : 'Сохранить викторину'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={reset}
                  disabled={isSaving}
                >
                  Отмена
                </Button>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Box>
  )
}
