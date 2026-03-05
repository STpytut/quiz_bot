import type { ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
} from '@mui/material'
import { Settings as SettingsIcon } from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            QuizMaster
          </Typography>
          {user ? (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/dashboard')}
                sx={{ mr: 1 }}
              >
                Мои викторины
              </Button>
              <Button
                color="inherit"
                onClick={() => navigate('/settings')}
                sx={{ mr: 1 }}
                startIcon={<SettingsIcon />}
              >
                Настройки
              </Button>
              <Button
                color="inherit"
                onClick={handleSignOut}
              >
                Выйти
              </Button>
            </>
          ) : (
            <>
              {location.pathname !== '/login' && (
                <Button color="inherit" onClick={() => navigate('/login')}>
                  Войти
                </Button>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  )
}
