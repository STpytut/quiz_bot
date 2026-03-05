import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  BarChart as StatsIcon,
  Share as ShareIcon,
} from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'
import { useQuiz } from '../hooks/useQuiz'
import type { Quiz } from '../types'
import ShareDialog from '../components/ShareDialog'

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [quizToShare, setQuizToShare] = useState<string | null>(null)
  const { user } = useAuth()
  const { fetchUserQuizzes, deleteQuiz } = useQuiz()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      loadQuizzes()
    }
  }, [user])

  const loadQuizzes = async () => {
    if (!user) return
    setLoading(true)
    const { data, error: fetchError } = await fetchUserQuizzes(user.id)
    if (fetchError) {
      setError(fetchError)
    } else if (data) {
      setQuizzes(data as Quiz[])
    }
    setLoading(false)
  }

  const handleDeleteClick = (quizId: string) => {
    setQuizToDelete(quizId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return
    const { error: deleteError } = await deleteQuiz(quizToDelete)
    if (deleteError) {
      setError(deleteError)
    } else {
      setQuizzes(quizzes.filter((q) => q.id !== quizToDelete))
    }
    setDeleteDialogOpen(false)
    setQuizToDelete(null)
  }

  const handleShareClick = (quizId: string) => {
    setQuizToShare(quizId)
    setShareDialogOpen(true)
  }

  if (loading) {
    return <Typography>Загрузка...</Typography>
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h3" component="h1">
          Мои викторины
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/create')}
        >
          Создать викторину
        </Button>
      </Box>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Вы еще не создали ни одной викторины
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create')}
              sx={{ mt: 2 }}
            >
              Создать первую викторину
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {quiz.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {quiz.description || 'Нет описания'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={`${(quiz as any).questions?.[0]?.count || 0} вопросов`}
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
                      title="Редактировать"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/stats/${quiz.id}`)}
                      title="Статистика"
                    >
                      <StatsIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleShareClick(quiz.id)}
                      title="Поделиться"
                    >
                      <ShareIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClick(quiz.id)}
                      title="Удалить"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить викторину</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы уверены, что хотите удалить эту викторину? Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>

      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        quizId={quizToShare || ''}
      />
    </Box>
  )
}
