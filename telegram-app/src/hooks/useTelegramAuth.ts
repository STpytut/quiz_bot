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
      // Step 1: Check if we already have a valid session
      const { data: { session: existingSession } } = await supabase.auth.getSession()
      if (existingSession?.user) {
        setUser(existingSession.user)
        updateTelegramLink(existingSession.user.id, tgUser.id)
        return
      }

      // Step 2: Try sign in with stable password
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: stablePassword,
      })

      if (signInData?.user) {
        setUser(signInData.user)
        updateTelegramLink(signInData.user.id, tgUser.id)
        return
      }

      // Step 3: Sign-in failed. Maybe user exists with old password — reset it
      const { data: resetData } = await supabase.rpc('reset_telegram_password', {
        p_telegram_id: tgUser.id,
        p_new_password: stablePassword,
      })

      const resetResult = resetData as { success: boolean } | null

      if (resetResult?.success) {
        // Password reset — try sign in again
        const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: stablePassword,
        })

        if (retryData?.user) {
          setUser(retryData.user)
          updateTelegramLink(retryData.user.id, tgUser.id)
          return
        }

        if (retryError) throw retryError
      }

      // Step 4: User truly doesn't exist — sign up
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

      // If signUp didn't create a session (email not confirmed), try signing in
      if (!signUpData.session) {
        const { data: postSignUpData } = await supabase.auth.signInWithPassword({
          email: virtualEmail,
          password: stablePassword,
        })
        if (postSignUpData?.user) {
          setUser(postSignUpData.user)
        } else {
          setUser(signUpData.user)
        }
      } else {
        setUser(signUpData.user)
      }

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

    } catch (err) {
      console.error('Telegram auth error:', err)
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
      // Non-critical
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
