import { useEffect, ReactNode } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { useTelegram } from '../hooks/useTelegram'

interface TelegramLayoutProps {
  children: ReactNode
}

export default function TelegramLayout({ children }: TelegramLayoutProps) {
  const { theme, isReady, isTelegram } = useTelegram()

  useEffect(() => {
    if (isTelegram) {
      document.body.style.backgroundColor = theme.bgColor
      document.body.style.color = theme.textColor
    }
  }, [theme, isTelegram])

  if (!isReady) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: theme.bgColor,
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.bgColor,
        color: theme.textColor,
        p: 2,
      }}
    >
      {!isTelegram && (
        <Box
          sx={{
            backgroundColor: '#fff3cd',
            color: '#856404',
            p: 2,
            mb: 2,
            borderRadius: 1,
          }}
        >
          <Typography variant="body2">
            ⚠️ Приложение запущено вне Telegram. Некоторые функции могут быть недоступны.
          </Typography>
        </Box>
      )}
      {children}
    </Box>
  )
}
