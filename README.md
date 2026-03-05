# Mission Control MVP

Mission Control is a production-usable MVP dashboard for OpenClaw built with Next.js App Router, TypeScript, Prisma, SQLite, and Tailwind CSS.

## MVP Features

- Mission banner with inline editing.
- Kanban task board (`Todo / In Progress / Review / Done`) with drag-and-drop and assignee support.
- Projects screen with status tracking and linked tasks.
- Memories timeline with searchable notes, tags, and dates.
- Documents center with metadata storage and full-text style search over stored text fields.
- Team/Org screen with agent roles, devices, missions, and parent-child hierarchy.
- Scheduler screen with cron jobs, `next_run`, and enabled toggle persisted in DB.
- Office view with lightweight 2D desk grid and agent placements.
- CRUD API routes for all core modules.

## Tech Stack

- Next.js App Router + TypeScript
- Prisma + SQLite
- Tailwind CSS
- Vitest for basic API tests

## Quick Start

1. Install dependencies:

```bash
npm install
```

If you are in a sandboxed environment that cannot write to `~/.npm`, run:

```bash
HOME="$PWD/.home" npm_config_cache="$PWD/.npm-cache" npm install
```

2. Initialize local env:

```bash
cp .env.example .env
```

3. Run setup (generate client, push schema, seed DB):

```bash
npm run setup
```

4. Start development server:

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### One-command boot after install

After `npm install`, you can run:

```bash
npm run bootstrap
```

This runs DB setup + dev server in one command.

## Setup Script

A helper script is included:

```bash
./scripts/setup.sh
```

It installs dependencies and runs database setup + seed.

## API Endpoints

- `GET /api/health`
- `GET,PUT /api/mission`
- `GET,POST /api/tasks`
- `GET,PATCH,DELETE /api/tasks/:id`
- `GET,POST /api/projects`
- `GET,PATCH,DELETE /api/projects/:id`
- `GET,POST /api/memories`
- `GET,PATCH,DELETE /api/memories/:id`
- `GET,POST /api/documents`
- `GET,PATCH,DELETE /api/documents/:id`
- `GET,POST /api/agents`
- `GET,PATCH,DELETE /api/agents/:id`
- `GET,POST /api/jobs`
- `GET,PATCH,DELETE /api/jobs/:id`
- `GET,POST /api/desks`
- `GET,PATCH,DELETE /api/desks/:id`

## Tests

Run tests:

```bash
npm test
```

Included basics:

- API health endpoint response test.
- Project API CRUD flow test (create then list).

## Production Deployment (Docker)

1. Build image:

```bash
docker build -t mission-control-mvp .
```

2. Run container:

```bash
docker run --rm -p 3000:3000 mission-control-mvp
```

The image performs Prisma generate + DB push + seed during build so the app starts ready.

### Docker Compose

```bash
docker compose up --build
```

## Useful Commands

```bash
npm run lint
npm run test
npm run build
npm run start
```

## Validation Gate

Use this sequence before opening a PR:

```bash
npm install
npm test
npm run build
```
