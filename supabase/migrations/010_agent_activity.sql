-- Agent Activity & Communications
-- For dashboard visibility into agent operations

-- Agent activity log (auto-deletes old records)
CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  agent_name TEXT,
  project TEXT,  -- ailmanack, myjunto, clawstreet, dashboard
  action TEXT NOT NULL,  -- message, file_write, task_start, task_complete, error, health_check
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_agent_activity_agent ON agent_activity(agent_id);
CREATE INDEX idx_agent_activity_project ON agent_activity(project);
CREATE INDEX idx_agent_activity_created ON agent_activity(created_at DESC);

-- Inter-agent messages
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  project TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_to ON agent_messages(to_agent, read);
CREATE INDEX idx_agent_messages_created ON agent_messages(created_at DESC);

-- Agent registry (current state)
CREATE TABLE IF NOT EXISTS agent_registry (
  id TEXT PRIMARY KEY,  -- scout, jeb, terry, etc.
  name TEXT NOT NULL,
  role TEXT,
  team TEXT NOT NULL,  -- ailmanack, myjunto, clawstreet
  status TEXT DEFAULT 'idle',  -- idle, active, error
  soul_path TEXT,
  memory_path TEXT,
  last_active TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to auto-delete old activity records (keep last 1000 per agent)
CREATE OR REPLACE FUNCTION cleanup_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM agent_activity
  WHERE id IN (
    SELECT id FROM agent_activity
    WHERE agent_id = NEW.agent_id
    ORDER BY created_at DESC
    OFFSET 1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run cleanup on insert
DROP TRIGGER IF EXISTS trigger_cleanup_activity ON agent_activity;
CREATE TRIGGER trigger_cleanup_activity
AFTER INSERT ON agent_activity
FOR EACH ROW
EXECUTE FUNCTION cleanup_agent_activity();

-- Function to auto-delete old messages (keep last 500 total)
CREATE OR REPLACE FUNCTION cleanup_agent_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM agent_messages
  WHERE id IN (
    SELECT id FROM agent_messages
    ORDER BY created_at DESC
    OFFSET 500
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_messages ON agent_messages;
CREATE TRIGGER trigger_cleanup_messages
AFTER INSERT ON agent_messages
FOR EACH ROW
EXECUTE FUNCTION cleanup_agent_messages();

-- Seed initial agent registry
INSERT INTO agent_registry (id, name, role, team, soul_path, memory_path) VALUES
  ('jai', 'Jai', 'Orchestrator', 'dashboard', '~/clawd/SOUL.md', '~/clawd/MEMORY.md'),
  ('scout', 'Scout', 'Eager Analyst', 'ailmanack', 'ailmanack/agents/scout/SOUL.md', 'ailmanack/agents/scout/MEMORY.md'),
  ('jeb', 'Jeb', 'Value Investor', 'ailmanack', 'ailmanack/agents/jeb/SOUL.md', 'ailmanack/agents/jeb/MEMORY.md'),
  ('ant', 'Ant', 'Quant/Trader', 'ailmanack', 'ailmanack/agents/ant/SOUL.md', 'ailmanack/agents/ant/MEMORY.md'),
  ('ben', 'Ben', 'Monitor', 'myjunto', 'myjunto/agents/ben/SOUL.md', 'myjunto/agents/ben/MEMORY.md'),
  ('terry', 'Terry', 'CTO', 'clawstreet', 'clawstreet/agents/terry/SOUL.md', 'clawstreet/agents/terry/MEMORY.md'),
  ('sport', 'Sport', 'Support', 'clawstreet', 'clawstreet/agents/sport/SOUL.md', 'clawstreet/agents/sport/MEMORY.md'),
  ('mark', 'Mark', 'Marketing', 'clawstreet', 'clawstreet/agents/mark/SOUL.md', 'clawstreet/agents/mark/MEMORY.md'),
  ('quai', 'Quai', 'QA', 'clawstreet', 'clawstreet/agents/quai/SOUL.md', 'clawstreet/agents/quai/MEMORY.md')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  team = EXCLUDED.team,
  updated_at = NOW();
