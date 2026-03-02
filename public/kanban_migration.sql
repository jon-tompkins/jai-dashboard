-- Migration: Add project, tags columns and update assignee constraint
-- Run this in Supabase SQL Editor

-- Add project column
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS project TEXT;

-- Add tags column (as JSONB array)
ALTER TABLE kanban_tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

-- Drop the old restrictive assignee constraint
ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_assignee_check;

-- Add new assignee constraint with all agents
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_assignee_check 
    CHECK (assignee IS NULL OR assignee IN ('scout', 'builder', 'jeb', 'ant', 'mark', 'jon', 'jai', 'terry', 'sport', 'quai'));

-- Drop the old priority constraint and add critical level
ALTER TABLE kanban_tasks DROP CONSTRAINT IF EXISTS kanban_tasks_priority_check;
ALTER TABLE kanban_tasks ADD CONSTRAINT kanban_tasks_priority_check 
    CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Create index on project
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_project ON kanban_tasks(project);
