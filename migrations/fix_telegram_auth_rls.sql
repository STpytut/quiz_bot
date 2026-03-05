-- Migration: Fix Telegram authentication RLS policies and conflict resolution
-- Run this SQL in your Supabase SQL Editor

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own telegram links" ON telegram_auth_links;
DROP POLICY IF EXISTS "Users can create telegram links" ON telegram_auth_links;
DROP POLICY IF EXISTS "Users can update their own telegram links" ON telegram_auth_links;

-- New RLS policies

-- Allow reading by user_id OR telegram_id (extracted from JWT)
CREATE POLICY "Users can view telegram links"
  ON telegram_auth_links FOR SELECT
  USING (
    user_id = auth.uid() 
    OR telegram_id = (auth.jwt() -> 'telegram_id')::bigint
  );

-- Allow insert for anyone (Telegram users don't have auth.uid() initially)
CREATE POLICY "Users can create telegram links"
  ON telegram_auth_links FOR INSERT
  WITH CHECK (true);

-- Allow update by user_id OR telegram_id
CREATE POLICY "Users can update telegram links"
  ON telegram_auth_links FOR UPDATE
  USING (
    user_id = auth.uid()
    OR telegram_id = (auth.jwt() -> 'telegram_id')::bigint
  );

-- Drop and recreate constraints for conflict resolution
ALTER TABLE telegram_auth_links 
DROP CONSTRAINT IF EXISTS telegram_auth_links_telegram_id_key;

-- Ensure telegram_id is unique (one telegram account per user)
ALTER TABLE telegram_auth_links
ADD CONSTRAINT telegram_auth_links_telegram_id_unique UNIQUE (telegram_id);

-- Remove user_id unique constraint if exists (allow multiple telegram accounts per user)
ALTER TABLE telegram_auth_links
DROP CONSTRAINT IF EXISTS telegram_auth_links_user_id_unique;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telegram_auth_links_user_id ON telegram_auth_links(user_id);

-- Function to auto-confirm virtual emails (telegram_*@quizmaster.virtual)
CREATE OR REPLACE FUNCTION auto_confirm_virtual_email()
RETURNS TRIGGER AS $$
BEGIN
  -- If email matches virtual pattern, auto-confirm
  IF NEW.email LIKE 'telegram_%@quizmaster.virtual' THEN
    NEW.email_confirmed_at = NOW();
    NEW.confirmed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS auto_confirm_virtual_email_trigger ON auth.users;

CREATE TRIGGER auto_confirm_virtual_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_virtual_email();
