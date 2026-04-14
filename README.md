# Forge Sandbox Template

Starter application template for CDS Forge sandboxes. This repository is cloned automatically when a new sandbox is provisioned.

## Quick Start

```bash
npm install
npm run dev
```

## Local Development with Docker

```bash
docker-compose up
```

This starts the Express app and a PostgreSQL database.

## Available Scripts

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `npm run dev`    | Start dev server with hot reload   |
| `npm run build`  | Compile TypeScript                 |
| `npm start`      | Run compiled production build      |
| `npm test`       | Run test suite                     |
| `npm run lint`   | Lint source files                  |
| `npm run format` | Format source files with Prettier  |
| `npm run migrate`| Run database migrations            |

## Routes

- `GET /` — Welcome page
- `GET /api/health` — Health check endpoint
- `GET /api/example` — Sample database query

## Environment Variables

| Variable       | Required | Default | Description                    |
| -------------- | -------- | ------- | ------------------------------ |
| `PORT`         | No       | 3000    | Server port                    |
| `DATABASE_URL` | No       | -       | PostgreSQL connection string   |
| `DB_POOL_SIZE` | No       | 10      | Database connection pool size  |
| `SANDBOX_NAME` | No       | -       | Display name for this sandbox  |
