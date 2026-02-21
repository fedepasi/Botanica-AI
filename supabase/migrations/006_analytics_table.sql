-- Migration: Analytics Tracking Table
-- Created: 2026-02-21
-- Purpose: Store analytics events for Beta Launch metrics

-- Create analytics events table
CREATE TABLE IF NOT EXISTS botanica_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    properties JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_event ON botanica_analytics(event);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON botanica_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON botanica_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON botanica_analytics(session_id);

-- Index for JSONB properties (for filtering by specific properties)
CREATE INDEX IF NOT EXISTS idx_analytics_properties ON botanica_analytics USING GIN(properties);

-- Enable RLS
ALTER TABLE botanica_analytics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own events
CREATE POLICY "Users can insert their own analytics events"
    ON botanica_analytics
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow users to view their own events (for debugging)
CREATE POLICY "Users can view their own analytics events"
    ON botanica_analytics
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create a view for daily metrics (useful for dashboards)
CREATE OR REPLACE VIEW botanica_daily_metrics AS
SELECT 
    DATE(timestamp) as date,
    event,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM botanica_analytics
GROUP BY DATE(timestamp), event
ORDER BY date DESC, count DESC;

-- Create a function to get retention metrics
CREATE OR REPLACE FUNCTION get_retention_metrics(start_date DATE, end_date DATE)
RETURNS TABLE (
    signup_date DATE,
    total_signups BIGINT,
    d1_retention BIGINT,
    d7_retention BIGINT,
    d30_retention BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH signups AS (
        SELECT 
            user_id,
            DATE(MIN(timestamp)) as first_seen
        FROM botanica_analytics
        WHERE event = 'user_signup'
          AND timestamp >= start_date
          AND timestamp <= end_date
        GROUP BY user_id
    ),
    activity AS (
        SELECT 
            user_id,
            DATE(timestamp) as active_date
        FROM botanica_analytics
        WHERE timestamp >= start_date
        GROUP BY user_id, DATE(timestamp)
    )
    SELECT 
        s.first_seen as signup_date,
        COUNT(DISTINCT s.user_id) as total_signups,
        COUNT(DISTINCT CASE WHEN a.active_date = s.first_seen + 1 THEN a.user_id END) as d1_retention,
        COUNT(DISTINCT CASE WHEN a.active_date = s.first_seen + 7 THEN a.user_id END) as d7_retention,
        COUNT(DISTINCT CASE WHEN a.active_date = s.first_seen + 30 THEN a.user_id END) as d30_retention
    FROM signups s
    LEFT JOIN activity a ON s.user_id = a.user_id
    GROUP BY s.first_seen
    ORDER BY s.first_seen;
END;
$$ LANGUAGE plpgsql;
