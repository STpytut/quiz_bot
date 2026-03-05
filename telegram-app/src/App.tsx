import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import TelegramLayout from './components/TelegramLayout'
import TelegramHome from './pages/TelegramHome'
import TelegramDashboard from './pages/TelegramDashboard'
import TelegramQuizCreator from './pages/TelegramQuizCreator'
import EmailBindingDialog from './components/EmailBindingDialog'
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
  const { loading, needsEmailBinding, error, bindEmail, signInWithEmail } = useTelegramAuth()

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

  if (needsEmailBinding) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TelegramLayout>
          <EmailBindingDialog
            onBind={bindEmail}
            onSignIn={signInWithEmail}
            error={error}
            loading={loading}
          />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
