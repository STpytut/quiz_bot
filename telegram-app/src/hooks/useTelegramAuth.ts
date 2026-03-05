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
      const { data: link, error: linkError } = await supabase
        .from('telegram_auth_links')
        .select('user_id, email, is_verified')
        .eq('telegram_id', tgUser.id)
        .single()

      if (linkError && linkError.code !== 'PGRST116') {
        throw linkError
      }

      if (link && link.is_verified) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          setUser(session.user)
        } else {
          setNeedsEmailBinding(true)
        }
      } else {
        setNeedsEmailBinding(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const bindEmail = useCallback(async (email: string, password: string) => {
    if (!tgUser) {
      throw new Error('Пользователь Telegram не найден')
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (!authUser) {
        throw new Error('Не удалось создать аккаунт')
      }

      const { error: linkError } = await supabase
        .from('telegram_auth_links')
        .insert({
          user_id: authUser.id,
          telegram_id: tgUser.id,
          telegram_username: tgUser.username,
          telegram_first_name: tgUser.first_name,
          telegram_last_name: tgUser.last_name,
          email,
          is_verified: true,
        })

      if (linkError) throw linkError

      setUser(authUser)
      setNeedsEmailBinding(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при привязке email'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tgUser])

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!tgUser) {
      throw new Error('Пользователь Telegram не найден')
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user: authUser }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (!authUser) {
        throw new Error('Не удалось войти')
      }

      const { error: linkError } = await supabase
        .from('telegram_auth_links')
        .upsert({
          user_id: authUser.id,
          telegram_id: tgUser.id,
          telegram_username: tgUser.username,
          telegram_first_name: tgUser.first_name,
          telegram_last_name: tgUser.last_name,
          email,
          is_verified: true,
        }, {
          onConflict: 'telegram_id'
        })

      if (linkError) throw linkError

      setUser(authUser)
      setNeedsEmailBinding(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при входе'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [tgUser])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setNeedsEmailBinding(true)
  }, [])

  return {
    user,
    loading,
    needsEmailBinding,
    error,
    bindEmail,
    signInWithEmail,
    signOut,
  }
}
