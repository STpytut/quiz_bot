import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
        }
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
          secondary_bg_color?: string
        }
        MainButton: {
          text: string
          color?: string
          textColor?: string
          show: () => void
          hide: () => void
          enable: () => void
          disable: () => void
          onClick: (callback: () => void) => void
        }
        BackButton: {
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
        }
        version: string
        platform: string
      }
    }
  }
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export function useTelegram() {
  const [tgUser, setTgUser] = useState<TelegramUser | null>(null)
  const [theme, setTheme] = useState({
    bgColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#6366f1',
    buttonTextColor: '#ffffff',
    secondaryBgColor: '#f5f5f5',
  })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      
      tg.ready()
      tg.expand()
      
      if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user
        setTgUser({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          language_code: user.language_code,
        })
      }
      
      if (tg.themeParams) {
        setTheme({
          bgColor: tg.themeParams.bg_color || '#ffffff',
          textColor: tg.themeParams.text_color || '#000000',
          buttonColor: tg.themeParams.button_color || '#6366f1',
          buttonTextColor: tg.themeParams.button_text_color || '#ffffff',
          secondaryBgColor: tg.themeParams.secondary_bg_color || '#f5f5f5',
        })
      }
      
      setIsReady(true)
    }
  }, [])

  const closeApp = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close()
    }
  }

  const showMainButton = (text: string, callback: () => void) => {
    if (window.Telegram?.WebApp) {
      const mainButton = window.Telegram.WebApp.MainButton
      mainButton.text = text
      mainButton.onClick(callback)
      mainButton.show()
    }
  }

  const hideMainButton = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.MainButton.hide()
    }
  }

  const showBackButton = (callback: () => void) => {
    if (window.Telegram?.WebApp) {
      const backButton = window.Telegram.WebApp.BackButton
      backButton.onClick(callback)
      backButton.show()
    }
  }

  const hideBackButton = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.BackButton.hide()
    }
  }

  return {
    tgUser,
    theme,
    isReady,
    isTelegram: !!window.Telegram,
    closeApp,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
  }
}
