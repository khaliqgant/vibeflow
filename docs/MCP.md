# 🔌 MCP Integration

Connect VibeFlow to Claude Code and let AI autonomously work on your tasks.

## What is MCP?

The **Model Context Protocol** (MCP) allows Claude Code to:
- Read your VibeFlow projects
- Fetch tasks from any agent
- Update task status
- Create new tasks
- Work autonomously

## Setup

### 1. Start VibeFlow MCP Server

```bash
npm run mcp
```

The server runs on stdio and waits for Claude Code to connect.

### 2. Configure Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "vibeflow": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/absolute/path/to/vibeflow"
    }
  }
}
```

**Important:** Use absolute path, not `~` or relative paths.

### 3. Restart Claude Code

The MCP server will be available in your next Claude Code session.

## Available Tools

### `list_projects`

List all tracked projects with task counts.

**Example:**
```
"Show me all my VibeFlow projects"
```

**Returns:**
```json
[
  {
    "id": "abc123",
    "name": "my-app",
    "path": "/Users/me/projects/my-app",
    "taskCount": 15,
    "completedTasks": 8
  }
]
```

---

### `get_project`

Get full project details with tasks and insights.

**Parameters:**
- `project_id` (required)

**Example:**
```
"Get details for project abc123"
```

---

### `get_project_tasks`

Get tasks filtered by status and/or agent.

**Parameters:**
- `project_id` (required)
- `status` (optional): `todo`, `in_progress`, `done`
- `agent_type` (optional): `marketing`, `technical`, etc.

**Example:**
```
"Show me all technical tasks that are in progress"
```

---

### `get_next_task`

Get the highest priority task to work on next.

**Parameters:**
- `project_id` (required)
- `agent_type` (optional): filter by agent

**Example:**
```
"What should I work on next in project abc123?"
```

**Returns:**
```json
{
  "id": "task789",
  "title": "Improve test coverage",
  "description": "Add unit tests for authentication module",
  "priority": "high",
  "status": "todo",
  "agentType": "technical"
}
```

---

### `update_task`

Update task fields (status, description, priority).

**Parameters:**
- `task_id` (required)
- `status` (optional): `todo`, `in_progress`, `done`
- `description` (optional)
- `priority` (optional): `low`, `medium`, `high`

**Example:**
```
"Mark task task789 as done"
```

---

### `create_task`

Create a new task.

**Parameters:**
- `project_id` (required)
- `title` (required)
- `description` (optional)
- `priority` (optional)
- `agent_type` (optional)

**Example:**
```
"Create a new technical task: Refactor API routes"
```

## Example Workflows

### Autonomous Task Completion

```
Claude, work on the next task in my VibeFlow project abc123
```

Claude Code will:
1. Fetch the next task via `get_next_task`
2. Read the task description
3. Work on the task autonomously
4. Mark as `in_progress` via `update_task`
5. Complete the work
6. Mark as `done` via `update_task`

### Batch Task Processing

```
Claude, complete all high-priority technical tasks in project abc123
```

Claude Code will:
1. Fetch filtered tasks via `get_project_tasks`
2. Loop through each
3. Complete them autonomously
4. Update statuses

### Daily Standup

```
What tasks did I complete today in VibeFlow?
```

Claude Code will:
1. List all projects
2. Filter tasks by status=done and today's date
3. Summarize your progress

## Tips

### Working with Multiple Projects

```
Show me tasks across all my VibeFlow projects
```

### Filtering by Agent

```
What marketing tasks need attention?
```

### Creating Smart Tasks

```
Claude, analyze my codebase and create appropriate tasks in VibeFlow
```

## Security Notes

- MCP server runs **locally only**
- No external network access
- Database is **local SQLite**
- API keys stay in your `.env`

## Troubleshooting

### "Server not found"

- Check absolute path in MCP config
- Ensure VibeFlow is installed
- Try `npm run mcp` manually first

### "Connection refused"

- Restart Claude Code
- Check no other MCP servers on same name
- Verify Node.js version (20+)

### "Permission denied"

```bash
chmod +x node_modules/.bin/tsx
```

### "Database locked"

- Close VibeFlow web UI
- Stop dev server
- Try MCP server again

## Advanced Usage

### Custom Commands

Create shortcuts in Claude Code:

```
/vibeflow-next → Get next task from VibeFlow
/vibeflow-done → Mark current task as done
```

### Scheduled Automation

Use with cron/scheduled tasks:

```bash
# Every morning, get today's tasks
0 9 * * * claude "What should I work on today in VibeFlow?"
```

## Technical Details

- **Protocol:** JSON-RPC over stdio
- **Server:** Node.js with @modelcontextprotocol/sdk
- **Database:** Direct Prisma queries
- **Latency:** <100ms per operation

## Future Enhancements

- [ ] WebSocket support (real-time)
- [ ] Task assignment/collaboration
- [ ] Voice command integration
- [ ] Mobile app MCP client

---

**Need help?** [MCP Documentation](https://modelcontextprotocol.io) • [GitHub Discussions](https://github.com/khaliqgant/vibeflow/discussions)
