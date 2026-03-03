-- Migration 007: Beta Feedback table
-- Stores in-app feedback from beta testers

CREATE TABLE IF NOT EXISTS botanica_beta_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'ux', 'idea', 'praise')),
  message TEXT NOT NULL,
  current_screen TEXT,
  app_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only the user can see their own feedback; anyone can insert
ALTER TABLE botanica_beta_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert feedback" ON botanica_beta_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own feedback" ON botanica_beta_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created ON botanica_beta_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_type ON botanica_beta_feedback(feedback_type);
