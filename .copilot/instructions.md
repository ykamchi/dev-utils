GitHub Copilot Terminal Rules

## Terminal Behavior
- **DO NOT** open new terminals unnecessarily.
- **ALWAYS** reuse an existing terminal session when executing commands.
- If a command is for a short, non-blocking task (like `ls`, `npm install`), use a free, existing terminal.
- If a command starts a long-running process (like `npm run dev` or a server), start it in a *dedicated* new terminal only if there isn't one already running the server.