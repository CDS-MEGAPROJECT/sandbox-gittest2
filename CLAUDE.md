# gittest2

## Project Overview
This is a test sandbox for demonstration only. This demo will show the request and provisioning process 

## Sandbox Configuration
- **Tier**: standard
- **vCPU**: 0.5
- **Memory**: 1024 MB
- **S3 Storage Limit**: 25 GB
- **Database Storage Limit**: 5 GB

## Tech Stack
- **Runtime**: Node.js 20 + TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` client)
- **Container**: Docker (multi-stage, non-root, read-only rootfs)
- **CI/CD**: GitHub Actions (ECR + ECS deploy)

## Key Commands
- `npm run dev` — Start dev server with hot reload
- `npm run build` — Compile TypeScript to dist/
- `npm start` — Run production build
- `npm test` — Run Jest test suite
- `npm run lint` — ESLint check
- `npm run migrate` — Run database migrations

## Project Structure
```
src/
  index.ts          — Express entrypoint with graceful shutdown
  routes/
    health.ts       — GET /api/health (ALB health check)
    index.ts        — GET / welcome page
    example.ts      — GET /api/example sample DB query
  db/
    client.ts       — PostgreSQL pool with retry logic
    migrate.ts      — Migration runner
    migrations/     — SQL migration files (run in order)
  utils/
    logger.ts       — Structured JSON logger
tests/
  health.test.ts    — Health endpoint tests
```

## Coding Standards
- TypeScript strict mode — no `any` types
- ESLint + Prettier enforced
- Structured JSON logging (timestamp, level, message, metadata)
- All database connections use the shared pool from `src/db/client.ts`

## Environment Variables
- `PORT` — Server port (default: 3000)
- `DATABASE_URL` — PostgreSQL connection string
- `DB_POOL_SIZE` — Connection pool size (default: 10)
- `NODE_ENV` — Runtime environment
- `SANDBOX_NAME` — Display name for this sandbox

## Resource Limits
This sandbox runs on the **standard** tier. Respect these limits:
- CPU: 0.5 vCPU
- Memory: 1024 MB
- S3: 25 GB
- Database: 5 GB

Exceeding these limits may trigger automatic hibernation.
