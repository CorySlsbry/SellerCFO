-- Analytics page tracking table
CREATE TABLE IF NOT EXISTS page_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL DEFAULT 'page_view',
  page TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-range queries
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON page_analytics(created_at DESC);
-- Index for page breakdown
CREATE INDEX IF NOT EXISTS idx_page_analytics_page ON page_analytics(page);
-- Index for event type queries
CREATE INDEX IF NOT EXISTS idx_page_analytics_event ON page_analytics(event);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  user_name TEXT DEFAULT 'Unknown',
  company_name TEXT DEFAULT 'Unknown',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: page_analytics should be insertable by anyone (anonymous tracking)
-- but only readable by service role (admin API uses service role key)
ALTER TABLE page_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts on page_analytics"
  ON page_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on page_analytics"
  ON page_analytics FOR ALL
  USING (auth.role() = 'service_role');

-- RLS: feedback should be insertable by authenticated users
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated inserts on feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role full access on feedback"
  ON feedback FOR ALL
  USING (auth.role() = 'service_role');
