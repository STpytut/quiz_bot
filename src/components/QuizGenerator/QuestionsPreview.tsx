import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from '@mui/material'
import { RadioButtonChecked as RadioIcon } from '@mui/icons-material'
import type { GeneratedQuiz } from '../../types/quizGenerator'

interface QuestionsPreviewProps {
  questions: GeneratedQuiz['questions']
  onUpdateQuestion: (questionIndex: number, updates: Partial<GeneratedQuiz['questions'][0]>) => void
  onUpdateAnswer: (questionIndex: number, answerIndex: number, updates: Partial<GeneratedQuiz['questions'][0]['answers'][0]>) => void
}

export default function QuestionsPreview({
  questions,
  onUpdateQuestion,
  onUpdateAnswer,
}: QuestionsPreviewProps) {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Сгенерированные вопросы ({questions.length})
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Просмотрите и отредактируйте вопросы перед сохранением
      </Typography>

      {questions.map((question, qIndex) => (
        <Card key={qIndex} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Вопрос {qIndex + 1}</Typography>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={2}
              value={question.text}
              onChange={(e) => onUpdateQuestion(qIndex, { text: e.target.value })}
              placeholder="Текст вопроса"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle2" gutterBottom>
              Варианты ответов
            </Typography>
            
            <RadioGroup
              value={question.answers.findIndex(a => a.is_correct).toString()}
              onChange={(e) => {
                const answerIndex = parseInt(e.target.value)
                onUpdateAnswer(qIndex, answerIndex, { is_correct: true })
              }}
            >
              {question.answers.map((answer, aIndex) => (
                <Box key={aIndex} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                  <FormControlLabel
                    value={aIndex.toString()}
                    control={<Radio />}
                    label=""
                    sx={{ mr: 0 }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    value={answer.text}
                    onChange={(e) => onUpdateAnswer(qIndex, aIndex, { text: e.target.value })}
                    placeholder={`Ответ ${aIndex + 1}`}
                    error={!answer.text.trim()}
                    helperText={!answer.text.trim() ? 'Обязательно' : ''}
                  />
                </Box>
              ))}
            </RadioGroup>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <RadioIcon color="success" fontSize="small" />
              <Typography variant="caption" color="text.secondary">
                Правильный ответ отмечен переключателем
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}
