-- Migration: Add linking_codes table for code-based account linking
-- Run this SQL in your Supabase SQL Editor

-- Table for one-time linking codes
CREATE TABLE linking_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('web', 'telegram')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

-- Index for fast code lookups
CREATE INDEX idx_linking_codes_code ON linking_codes(code);
CREATE INDEX idx_linking_codes_user_id ON linking_codes(user_id);

-- Auto-cleanup: delete expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_linking_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM linking_codes WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cleanup_linking_codes_trigger
  AFTER INSERT ON linking_codes
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_expired_linking_codes();

-- Enable RLS
ALTER TABLE linking_codes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can create codes
CREATE POLICY "Authenticated users can create linking codes"
  ON linking_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can view codes (needed to look up by code)
CREATE POLICY "Authenticated users can view linking codes"
  ON linking_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can delete their own codes
CREATE POLICY "Users can delete their own linking codes"
  ON linking_codes FOR DELETE
  USING (user_id = auth.uid());

-- Function to link accounts: transfers quizzes and updates telegram_auth_links
CREATE OR REPLACE FUNCTION link_accounts(
  p_code TEXT,
  p_current_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_link_record RECORD;
  v_other_user_id UUID;
  v_other_platform TEXT;
  v_quizzes_moved INT;
BEGIN
  -- Find the linking code
  SELECT * INTO v_link_record
  FROM linking_codes
  WHERE code = p_code AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Код не найден или истёк');
  END IF;

  -- Can't link to yourself
  IF v_link_record.user_id = p_current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Нельзя привязать к своему же аккаунту');
  END IF;

  v_other_user_id := v_link_record.user_id;
  v_other_platform := v_link_record.platform;

  -- Transfer quizzes from the other user to the current user
  UPDATE quizzes SET user_id = p_current_user_id
  WHERE user_id = v_other_user_id;

  GET DIAGNOSTICS v_quizzes_moved = ROW_COUNT;

  -- Update telegram_auth_links to point to the current user
  IF v_other_platform = 'telegram' THEN
    -- Telegram user created the code → link their telegram to current (web) user
    UPDATE telegram_auth_links
    SET user_id = p_current_user_id, is_verified = true
    WHERE user_id = v_other_user_id;
  ELSE
    -- Web user created the code → link current (telegram) user's telegram to web user
    UPDATE telegram_auth_links
    SET user_id = v_other_user_id, is_verified = true
    WHERE user_id = p_current_user_id;

    -- Transfer quizzes back to web user (current user's quizzes go to web user)
    UPDATE quizzes SET user_id = v_other_user_id
    WHERE user_id = p_current_user_id;
  END IF;

  -- Delete the used code and all codes for both users
  DELETE FROM linking_codes WHERE user_id IN (v_other_user_id, p_current_user_id);

  RETURN json_build_object(
    'success', true,
    'quizzes_moved', v_quizzes_moved,
    'linked_platform', v_other_platform
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
