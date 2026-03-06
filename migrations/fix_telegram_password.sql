-- Migration: Fix Telegram auth for existing users with old random passwords
-- Run this SQL in your Supabase SQL Editor

-- Function to reset password for virtual Telegram email users
-- This is needed because old code used random passwords (tg_${id}_${Date.now()})
-- and new code uses stable passwords (tg_secure_${id})
CREATE OR REPLACE FUNCTION reset_telegram_password(
  p_telegram_id BIGINT,
  p_new_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_email TEXT;
  v_user_id UUID;
BEGIN
  v_email := 'telegram_' || p_telegram_id || '@quizmaster.virtual';

  -- Find the user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'user_not_found');
  END IF;

  -- Update password
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf'))
  WHERE id = v_user_id;

  -- Make sure the user is confirmed
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
