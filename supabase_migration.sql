-- Migration: Persistent Task System for Botanica-AI
-- Run this in your Supabase SQL Editor

-- ===========================================
-- Table: botanica_tasks
-- ===========================================
-- Drop incomplete table from previous migration attempt
DROP TABLE IF EXISTS botanica_tasks CASCADE;

CREATE TABLE botanica_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id UUID NOT NULL REFERENCES botanica_plants(id) ON DELETE CASCADE,
  plant_name TEXT NOT NULL,

  -- Content
  task TEXT NOT NULL,
  reason TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  task_nature TEXT NOT NULL DEFAULT 'routine',

  -- Temporal window (for structural tasks)
  scheduled_month INTEGER CHECK (scheduled_month BETWEEN 1 AND 12),
  window_start DATE,
  window_end DATE,

  -- Priority and status
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  weather_at_completion JSONB,
  user_notes TEXT,

  -- Meta
  language TEXT DEFAULT 'en',
  generation_batch TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_botanica_tasks_user_status ON botanica_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_botanica_tasks_user_plant ON botanica_tasks(user_id, plant_id);
CREATE INDEX IF NOT EXISTS idx_botanica_tasks_user_month ON botanica_tasks(user_id, scheduled_month);
CREATE INDEX IF NOT EXISTS idx_botanica_tasks_user_window ON botanica_tasks(user_id, window_start);

-- RLS
ALTER TABLE botanica_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON botanica_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON botanica_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON botanica_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON botanica_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_botanica_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_botanica_tasks_updated_at
  BEFORE UPDATE ON botanica_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_botanica_tasks_updated_at();

-- ===========================================
-- Table: botanica_adaptation_log
-- ===========================================
DROP TABLE IF EXISTS botanica_adaptation_log CASCADE;

CREATE TABLE botanica_adaptation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adapted_at TIMESTAMPTZ DEFAULT now(),
  adaptation_period INTEGER NOT NULL,
  year_adapted INTEGER NOT NULL,
  weather_context JSONB,
  tasks_added INTEGER DEFAULT 0,
  tasks_modified INTEGER DEFAULT 0,
  UNIQUE(user_id, adaptation_period, year_adapted)
);

-- RLS
ALTER TABLE botanica_adaptation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adaptation logs"
  ON botanica_adaptation_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adaptation logs"
  ON botanica_adaptation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);
