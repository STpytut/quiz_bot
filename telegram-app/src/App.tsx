import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import TelegramLayout from './components/TelegramLayout'
import TelegramHome from './pages/TelegramHome'
import TelegramDashboard from './pages/TelegramDashboard'
import TelegramQuizCreator from './pages/TelegramQuizCreator'
import TelegramSettings from './pages/TelegramSettings'
import { useTelegramAuth } from './hooks/useTelegramAuth'

const theme = createTheme({
  palette: {
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#ec4899',
    },
  },
})

export default function App() {
  const { loading, error } = useTelegramAuth()

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TelegramLayout>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div>Loading...</div>
          </div>
        </TelegramLayout>
      </ThemeProvider>
    )
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TelegramLayout>
          <div style={{ padding: '20px', color: '#f44336' }}>
            <h3>Ошибка</h3>
            <p>{error}</p>
          </div>
        </TelegramLayout>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <TelegramLayout>
                <TelegramHome />
              </TelegramLayout>
            }
          />
          <Route
            path="/dashboard"
            element={
              <TelegramLayout>
                <TelegramDashboard />
              </TelegramLayout>
            }
          />
          <Route
            path="/create"
            element={
              <TelegramLayout>
                <TelegramQuizCreator />
              </TelegramLayout>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <TelegramLayout>
                <TelegramQuizCreator />
              </TelegramLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <TelegramLayout>
                <TelegramSettings />
              </TelegramLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
