-- Migration: Add Fish Audio cost tracking to cost_sessions table
-- Created: 2025-12-07
-- Description: Adds columns to track Fish Audio TTS usage and provider selection

-- Add Fish Audio cost columns
ALTER TABLE cost_sessions
ADD COLUMN IF NOT EXISTS fishaudio_cost DECIMAL(10, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fishaudio_characters INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tts_provider VARCHAR(20);

-- Add comment to columns
COMMENT ON COLUMN cost_sessions.fishaudio_cost IS 'Cost incurred for Fish Audio TTS usage ($0.015/1k chars)';
COMMENT ON COLUMN cost_sessions.fishaudio_characters IS 'Total characters processed by Fish Audio TTS';
COMMENT ON COLUMN cost_sessions.tts_provider IS 'TTS provider used: elevenlabs or fishaudio';

-- Create index for querying by TTS provider
CREATE INDEX IF NOT EXISTS idx_cost_sessions_tts_provider ON cost_sessions(tts_provider);

-- Create index for cost analysis queries
CREATE INDEX IF NOT EXISTS idx_cost_sessions_user_time ON cost_sessions(user_id, created_at DESC);

-- Update existing records to set tts_provider based on which has non-zero values
UPDATE cost_sessions
SET tts_provider = CASE
  WHEN elevenlabs_characters > 0 THEN 'elevenlabs'
  ELSE NULL
END
WHERE tts_provider IS NULL;
