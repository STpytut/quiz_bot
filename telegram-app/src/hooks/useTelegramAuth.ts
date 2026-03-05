import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTelegram } from './useTelegram'
import type { User } from '@supabase/supabase-js'

export function useTelegramAuth() {
  const { tgUser, isReady } = useTelegram()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
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

    const virtualEmail = `telegram_${tgUser.id}@quizmaster.virtual`
    const stablePassword = `tg_secure_${tgUser.id}`

    try {
      // Step 1: Try to sign in (returning user)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: stablePassword,
      })

      if (signInData?.user) {
        setUser(signInData.user)
        // Update telegram info in background
        updateTelegramLink(signInData.user.id, tgUser.id)
        return
      }

      // Step 2: User doesn't exist yet — sign up
      if (signInError) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: virtualEmail,
          password: stablePassword,
          options: {
            data: {
              telegram_id: tgUser.id,
              telegram_username: tgUser.username,
            }
          }
        })

        if (signUpError) throw signUpError
        if (!signUpData.user) throw new Error('Не удалось создать аккаунт')

        // Create telegram_auth_links entry
        await supabase
          .from('telegram_auth_links')
          .upsert({
            user_id: signUpData.user.id,
            telegram_id: tgUser.id,
            telegram_username: tgUser.username || null,
            telegram_first_name: tgUser.first_name,
            telegram_last_name: tgUser.last_name || null,
            is_verified: true,
          }, {
            onConflict: 'telegram_id',
          })

        setUser(signUpData.user)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка авторизации'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const updateTelegramLink = async (userId: string, telegramId: number) => {
    try {
      await supabase
        .from('telegram_auth_links')
        .upsert({
          user_id: userId,
          telegram_id: telegramId,
          telegram_username: tgUser?.username || null,
          telegram_first_name: tgUser?.first_name || null,
          telegram_last_name: tgUser?.last_name || null,
          is_verified: true,
        }, {
          onConflict: 'telegram_id',
        })
    } catch {
      // Non-critical, don't break the flow
    }
  }

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  return {
    user,
    loading,
    error,
    signOut,
  }
}
