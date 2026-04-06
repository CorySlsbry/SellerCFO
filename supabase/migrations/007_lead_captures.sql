-- Lead magnet email captures
-- Stores leads from the landing page lead magnet form

CREATE TABLE IF NOT EXISTS lead_captures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  first_name text,
  source text DEFAULT 'ai-prompts-lead-magnet',
  captured_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Index on email for dedup lookups
CREATE INDEX IF NOT EXISTS idx_lead_captures_email ON lead_captures(email);

-- Index on captured_at for reporting
CREATE INDEX IF NOT EXISTS idx_lead_captures_date ON lead_captures(captured_at);

-- RLS: Only service role can insert/read (API route uses service key)
ALTER TABLE lead_captures ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to lead_captures"
  ON lead_captures
  FOR ALL
  USING (true)
  WITH CHECK (true);
