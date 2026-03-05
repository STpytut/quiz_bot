import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTelegram } from './useTelegram'
import type { User } from '@supabase/supabase-js'

export function useTelegramAuth() {
  const { tgUser, isReady } = useTelegram()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsEmailBinding, setNeedsEmailBinding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isReady && tgUser) {
      authenticateWithTelegram()
    } else if (isReady && !tgUser) {
      setLoading(false)
      setError('Не удалось получить данные пользователя Telegram')
    }
  }, [isReady, tgUser])

  const authenticateWithTelegram = async () => {
    if (!tgUser) return

    setLoading(true)
    setError(null)

    try {
      // Проверяем, есть ли связь telegram_id с аккаунтом
      const { data: link, error: linkError } = await supabase
        .from('telegram_auth_links')
        .select('user_id, email, is_verified')
        .eq('telegram_id', tgUser.id)
        .single()

      if (linkError && linkError.code !== 'PGRST116') {
        throw linkError
      }

      if (link && link.is_verified && link.user_id) {
        // Аккаунт уже привязан - создаем сессию
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          setUser(session.user)
        } else {
          // Если сессии нет, пробуем войти через Telegram ID
          await createTelegramSession(tgUser.id)
        }
      } else {
        // Первый вход - создаем виртуальный аккаунт через Telegram
        await createTelegramSession(tgUser.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const createTelegramSession = async (telegramId: number) => {
    // Создаем виртуальный email на основе Telegram ID
    const virtualEmail = `telegram_${telegramId}@quizmaster.virtual`
    const virtualPassword = `tg_${telegramId}_${Date.now()}`

    try {
      // Пробуем найти существующего пользователя
      const { data: existingLink } = await supabase
        .from('telegram_auth_links')
        .select('user_id')
        .eq('telegram_id', telegramId)
        .single()

      if (existingLink?.user_id) {
        // Пользователь уже существует, обновляем связь
        const { error: updateError } = await supabase
          .from('telegram_auth_links')
          .update({ 
            telegram_username: tgUser?.username,
            telegram_first_name: tgUser?.first_name,
            telegram_last_name: tgUser?.last_name,
            is_verified: true,
          })
          .eq('telegram_id', telegramId)

        if (updateError) throw updateError
      } else {
        // Создаем нового пользователя
        const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: virtualPassword,
          options: {
            data: {
              telegram_id: telegramId,
              telegram_username: tgUser?.username,
            }
          }
        })

        if (signUpError) throw signUpError

        if (!authUser) {
          throw new Error('Не удалось создать аккаунт')
        }

        // Создаем связь
        const { error: linkError } = await supabase
          .from('telegram_auth_links')
          .insert({
            user_id: authUser.id,
            telegram_id: telegramId,
            telegram_username: tgUser?.username,
            telegram_first_name: tgUser?.first_name,
            telegram_last_name: tgUser?.last_name,
            is_verified: true,
          })

        if (linkError) throw linkError

        setUser(authUser)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка создания сессии'
      setError(message)
      throw err
    }
  }

  const bindEmail = useCallback(async (email: string, _password?: string) => {
    if (!tgUser || !user) {
      throw new Error('Пользователь не найден')
    }

    setLoading(true)
    setError(null)

    try {
      // Обновляем email в существующем аккаунте
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
      })

      if (updateError) throw updateError

      // Обновляем связь
      const { error: linkError } = await supabase
        .from('telegram_auth_links')
        .update({
          email: email,
        })
        .eq('telegram_id', tgUser.id)

      if (linkError) throw linkError

      setNeedsEmailBinding(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при привязке email'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tgUser, user])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNeedsEmailBinding(false)
  }, [])

  return {
    user,
    loading,
    needsEmailBinding,
    error,
    bindEmail,
    signOut,
  }
}
