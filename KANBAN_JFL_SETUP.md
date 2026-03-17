# JFL Kanban Integration

## API Endpoint
`/api/kanban-jfl` - GitHub Issues-backed kanban

## Environment Variables
Add to `.env.local`:
```
GITHUB_TOKEN=ghp_xxx
KANBan_MODE=jfl
```

## How It Works
- Reads/writes to GitHub Issues in `jon-tompkins/clawd`
- Uses JFL labels: `jfl/backlog`, `jfl/ready`, `jfl/in-progress`, `jfl/done`
- Frontend stays the same, backend switched to GitHub API

## Testing
```bash
# List tasks
curl /api/kanban-jfl

# Create task
curl -X POST /api/kanban-jfl \
  -H "Content-Type: application/json" \
  -d '{"title": "Test task", "status": "backlog", "assignee": "scout"}'
```
