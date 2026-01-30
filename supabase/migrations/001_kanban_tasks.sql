-- Create kanban_tasks table
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'ready', 'in_progress', 'done')),
    assignee TEXT CHECK (assignee IS NULL OR assignee IN ('scout', 'builder')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    result TEXT,
    session_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON kanban_tasks(status);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_assignee ON kanban_tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_created_at ON kanban_tasks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for anon users (adjust as needed for production)
CREATE POLICY "Allow all operations for anon" ON kanban_tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant access to the anon role
GRANT ALL ON kanban_tasks TO anon;
GRANT USAGE ON SCHEMA public TO anon;
