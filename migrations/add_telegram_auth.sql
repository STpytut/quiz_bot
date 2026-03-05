-- Migration: Add Telegram authentication support
-- Run this SQL in your Supabase SQL Editor

-- Create table for linking Telegram and Web accounts
CREATE TABLE telegram_auth_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  email TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_telegram_auth_links_user_id ON telegram_auth_links(user_id);
CREATE INDEX idx_telegram_auth_links_telegram_id ON telegram_auth_links(telegram_id);

-- Enable Row Level Security
ALTER TABLE telegram_auth_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for telegram_auth_links
CREATE POLICY "Users can view their own telegram links"
  ON telegram_auth_links FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create telegram links"
  ON telegram_auth_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own telegram links"
  ON telegram_auth_links FOR UPDATE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_telegram_auth_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_telegram_auth_links_updated_at
  BEFORE UPDATE ON telegram_auth_links
  FOR EACH ROW
  EXECUTE FUNCTION update_telegram_auth_links_updated_at();
