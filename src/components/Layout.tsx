import { useState, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { Settings as SettingsIcon, Menu as MenuIcon } from '@mui/icons-material'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    handleMenuClose()
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    handleMenuClose()
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, cursor: 'pointer', fontWeight: 'bold' }}
            onClick={() => navigate('/')}
          >
            QuizMaster
          </Typography>

          {isMobile ? (
            // Mobile Menu
            <>
              {user || location.pathname !== '/login' ? (
                 <IconButton
                 size="large"
                 edge="end"
                 color="inherit"
                 aria-label="menu"
                 onClick={handleMenuOpen}
               >
                 <MenuIcon />
               </IconButton>
              ) : null}
             
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {user ? [
                  <MenuItem key="dashboard" onClick={() => handleNavigation('/dashboard')}>
                    Мои викторины
                  </MenuItem>,
                  <MenuItem key="settings" onClick={() => handleNavigation('/settings')}>
                    Настройки
                  </MenuItem>,
                  <MenuItem key="signout" onClick={handleSignOut}>
                    Выйти
                  </MenuItem>
                ] : [
                  <MenuItem key="login" onClick={() => handleNavigation('/login')}>
                    Войти
                  </MenuItem>
                ]}
              </Menu>
            </>
          ) : (
            // Desktop Menu
            <>
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
                  <Button color="inherit" onClick={handleSignOut}>
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
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  )
}
