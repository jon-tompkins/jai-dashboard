import { NextRequest, NextResponse } from 'next/server';

// GitHub API configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
const REPO_OWNER = 'jon-tompkins';
const REPO_NAME = 'clawd';

// JFL Kanban column labels
const COLUMNS = {
  backlog: 'jfl/backlog',
  ready: 'jfl/ready', 
  in_progress: 'jfl/in-progress',
  done: 'jfl/done'
};

// Map column names to JFL labels
const COLUMN_TO_LABEL: Record<string, string> = {
  'backlog': 'jfl/backlog',
  'ready': 'jfl/ready',
  'in_progress': 'jfl/in-progress',
  'done': 'jfl/done'
};

const LABEL_TO_COLUMN: Record<string, string> = {
  'jfl/backlog': 'backlog',
  'jfl/ready': 'ready',
  'jfl/in-progress': 'in_progress',
  'jfl/done': 'done'
};

// GitHub API helper
async function githubApi(path: string, options: RequestInit = {}) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// GET /api/kanban - List all tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');
    
    // Fetch issues from GitHub
    let issues = await githubApi('/issues?state=open&labels=jfl/backlog,jfl/ready,jfl/in-progress,jfl/done&per_page=100');
    
    // Transform to kanban format
    let tasks = issues.map((issue: any) => {
      // Determine column from labels
      const columnLabel = issue.labels.find((l: any) => l.name.startsWith('jfl/'))?.name;
      const status = LABEL_TO_COLUMN[columnLabel] || 'backlog';
      
      // Extract assignee from assignees or body
      const assignee = issue.assignees?.[0]?.login || 
        issue.body?.match(/@(\w+)/)?.[1] || 
        null;
      
      // Extract project from labels
      const project = issue.labels.find((l: any) => 
        !l.name.startsWith('jfl/') && 
        !['critical', 'high', 'medium', 'low'].includes(l.name)
      )?.name;
      
      // Extract priority
      const priority = issue.labels.find((l: any) => 
        ['critical', 'high', 'medium', 'low'].includes(l.name)
      )?.name || 'medium';
      
      return {
        id: issue.number.toString(),
        title: issue.title,
        description: issue.body || '',
        status,
        assignee,
        priority,
        project,
        labels: issue.labels.map((l: any) => l.name),
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        url: issue.html_url
      };
    });
    
    // Filter by status if provided
    if (status) {
      tasks = tasks.filter((t: any) => t.status === status);
    }
    
    // Filter by assignee if provided
    if (assignee) {
      tasks = tasks.filter((t: any) => t.assignee === assignee);
    }
    
    // Calculate summary
    const summary = {
      backlog: tasks.filter((t: any) => t.status === 'backlog').length,
      ready: tasks.filter((t: any) => t.status === 'ready').length,
      in_progress: tasks.filter((t: any) => t.status === 'in_progress').length,
      done: tasks.filter((t: any) => t.status === 'done').length,
    };
    
    return NextResponse.json({
      lastUpdated: new Date().toISOString(),
      columns: ['backlog', 'ready', 'in_progress', 'done'],
      tasks,
      summary
    });
    
  } catch (error) {
    console.error('Kanban API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch kanban tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/kanban - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const title = body.title || 'Untitled';
    const description = body.description || '';
    const status = body.status || 'backlog';
    const assignee = body.assignee;
    const priority = body.priority || 'medium';
    const project = body.project;
    const labels = body.labels || [];
    
    // Build labels array
    const issueLabels = [
      COLUMN_TO_LABEL[status],
      priority,
      ...labels
    ];
    if (project) issueLabels.push(project);
    
    // Build body
    let issueBody = description;
    if (assignee) {
      issueBody += `\n\n@${assignee}`;
    }
    
    // Create GitHub issue
    const issue = await githubApi('/issues', {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: issueBody,
        labels: issueLabels
      })
    });
    
    // Assign if specified
    if (assignee) {
      await githubApi(`/issues/${issue.number}/assignees`, {
        method: 'POST',
        body: JSON.stringify({ assignees: [assignee] })
      });
    }
    
    return NextResponse.json({
      ok: true,
      task: {
        id: issue.number.toString(),
        title: issue.title,
        description,
        status,
        assignee,
        priority,
        project,
        created_at: issue.created_at
      }
    });
    
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ 
      error: 'Failed to create task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PATCH /api/kanban - Update task (move columns, edit)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }
    
    const issueNumber = parseInt(id);
    const updateData: any = {};
    const newLabels: string[] = [];
    
    // Get current issue to preserve other labels
    const currentIssue = await githubApi(`/issues/${issueNumber}`);
    const currentLabels = currentIssue.labels.map((l: any) => l.name);
    
    // Build new labels
    if (updates.status) {
      // Remove old column labels
      const nonColumnLabels = currentLabels.filter((l: string) => !l.startsWith('jfl/'));
      newLabels.push(COLUMN_TO_LABEL[updates.status], ...nonColumnLabels);
    }
    
    if (updates.priority) {
      const withoutPriority = newLabels.filter((l: string) => 
        !['critical', 'high', 'medium', 'low'].includes(l)
      );
      newLabels.length = 0;
      newLabels.push(...withoutPriority, updates.priority);
    }
    
    if (updates.project) {
      const withoutProject = newLabels.filter((l: string) => 
        !['myjunto', 'clawstreet', 'dashboard', 'infra', 'personal'].includes(l)
      );
      newLabels.length = 0;
      newLabels.push(...withoutProject, updates.project);
    }
    
    if (newLabels.length > 0) {
      updateData.labels = [...new Set(newLabels)];
    }
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.body = updates.description;
    if (updates.assignee) {
      await githubApi(`/issues/${issueNumber}/assignees`, {
        method: 'POST',
        body: JSON.stringify({ assignees: [updates.assignee] })
      });
    }
    
    // Update issue
    const issue = await githubApi(`/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData)
    });
    
    return NextResponse.json({ ok: true, task: issue });
    
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ 
      error: 'Failed to update task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/kanban - Close task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing task id' }, { status: 400 });
    }
    
    const issueNumber = parseInt(id);
    
    // Close the issue
    await githubApi(`/issues/${issueNumber}`, {
      method: 'PATCH',
      body: JSON.stringify({ state: 'closed' })
    });
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ 
      error: 'Failed to close task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}