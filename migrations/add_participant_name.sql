-- Migration: Add participant_name column for anonymous quiz participation
-- Run this SQL in your Supabase SQL Editor

-- Add participant_name column to quiz_sessions table
ALTER TABLE quiz_sessions 
ADD COLUMN IF NOT EXISTS participant_name TEXT;

-- Update comment
COMMENT ON COLUMN quiz_sessions.participant_name IS 'Name of the participant for anonymous users';
