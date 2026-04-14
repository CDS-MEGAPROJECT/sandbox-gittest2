# CDS Forge Sandbox -- Developer Guide

**Document ID**: FORGE-DEV-001
**Classification**: Internal -- CDS Engineering
**Last Updated**: 2026-04-14

---

## Welcome to Your Sandbox

Your CDS Forge sandbox is a fully isolated development environment running on
AWS. It includes:

- A containerized Node.js/TypeScript application (Express.js)
- A managed PostgreSQL database (Aurora Serverless v2)
- S3 object storage for files and assets
- A GitHub repository with CI/CD pipeline
- A unique subdomain: `<your-sandbox>.dev.cds-megaproject.com`

This guide covers everything you need to get started, develop your application,
and deploy changes.

---

## 1. Getting Started

### Access Your Sandbox

After your sandbox is provisioned, you will receive an email with:

- **Sandbox URL**: `https://<your-sandbox>.dev.cds-megaproject.com`
- **GitHub Repository**: `https://github.com/cds-megaproject/cds-forge-sandbox-<your-sandbox>`
- **Database Connection**: Available in the portal under your sandbox details

### Clone Your Repository

```bash
git clone https://github.com/cds-megaproject/cds-forge-sandbox-<your-sandbox>.git
cd cds-forge-sandbox-<your-sandbox>
```

### Install Dependencies

```bash
npm install
```

### Verify the Setup

```bash
# Run tests
npm test

# Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 2. DevContainer Setup

Your sandbox repository includes a DevContainer configuration for VS Code. This
provides a consistent development environment with all required tools
pre-installed.

### Prerequisites

- Docker Desktop installed and running
- VS Code with the "Dev Containers" extension (ms-vscode-remote.remote-containers)

### Launch the DevContainer

1. Open the repository in VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and select
   "Dev Containers: Reopen in Container"
3. VS Code will build and start the container (first launch takes 2-3 minutes)
4. Once inside the container, all dependencies are pre-installed

### DevContainer Includes

- Node.js 20 LTS
- TypeScript compiler
- PostgreSQL client (`psql`)
- AWS CLI v2
- Git
- ESLint and Prettier configured

### Local Development with Docker Compose

For local development with a database:

```bash
# Start the local PostgreSQL database
docker compose up -d db

# Run database migrations
npm run migrate

# Start the development server
npm run dev
```

The `docker-compose.yml` includes:

- PostgreSQL 15 on port 5432
- Automatic database creation
- Volume persistence for database data

---

## 3. Connecting to Your Database

### Connection Details

Your database connection string is available in the Forge portal under your
sandbox details. It follows this format:

```
postgresql://forge_<sandbox-id>:<password>@<aurora-endpoint>:5432/forge?schema=sandbox_<sandbox-id>
```

### Environment Variables

Set the following in your `.env` file for local development:

```bash
# Local development (Docker Compose)
DATABASE_URL=postgresql://forge_dev:forge_dev@localhost:5432/forge_dev
DB_POOL_SIZE=10

# Production (set automatically by the platform)
# DATABASE_URL=postgresql://forge_<id>:<pass>@<aurora>:5432/forge?schema=sandbox_<id>
```

### Using the Database Client

The project includes a pre-configured PostgreSQL client with connection pooling:

```typescript
import { pool, query } from './db/client';

// Simple query
const result = await query('SELECT NOW() as current_time');
console.log(result.rows[0].current_time);

// Parameterized query (always use this for user input)
const users = await query(
  'SELECT * FROM users WHERE email = $1',
  ['user@example.com']
);

// Transaction
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO items (name) VALUES ($1)', ['item-1']);
  await client.query('INSERT INTO items (name) VALUES ($1)', ['item-2']);
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

### Running Migrations

Database migrations are stored in `src/db/migrations/` as numbered SQL files.

```bash
# Run all pending migrations
npm run migrate

# Create a new migration
# Create a new file: src/db/migrations/002_create_users.sql
```

Migration files are executed in alphabetical order. Use a numeric prefix to
control ordering:

```
src/db/migrations/
  001_initial_schema.sql
  002_create_users.sql
  003_add_user_email_index.sql
```

---

## 4. Using S3 Storage

### Access Your Bucket

Your sandbox has a dedicated S3 prefix for file storage:

```
s3://forge-sandboxes/<sandbox-id>/
```

### Environment Variables

```bash
# Available in your sandbox environment
S3_BUCKET=forge-sandboxes
S3_PREFIX=<sandbox-id>/
AWS_REGION=us-east-1
```

### Upload and Download Files

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION });

// Upload a file
await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: `${process.env.S3_PREFIX}uploads/my-file.txt`,
  Body: Buffer.from('Hello, world!'),
  ContentType: 'text/plain',
}));

// Download a file
const response = await s3.send(new GetObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: `${process.env.S3_PREFIX}uploads/my-file.txt`,
}));
const body = await response.Body?.transformToString();
```

### Storage Limits

Your S3 usage is limited by your sandbox tier:

| Tier     | S3 Limit |
|----------|----------|
| Starter  | 5 GB     |
| Standard | 25 GB    |
| Power    | 100 GB   |

Exceeding the storage limit may trigger automatic hibernation.

---

## 5. Deploying Changes

### Automatic Deployment

Your sandbox uses a GitHub Actions CI/CD pipeline. Every push to the `main`
branch automatically:

1. Runs the linter (`npm run lint`)
2. Runs tests (`npm run test`)
3. Builds the Docker image
4. Pushes to Amazon ECR
5. Updates the ECS service

### Deployment Workflow

```bash
# Make your changes
git add .
git commit -m "feat: add user registration endpoint"
git push origin main
```

The deployment typically takes 3-5 minutes. Monitor progress in the GitHub
Actions tab of your repository.

### Manual Deployment

If you need to trigger a deployment without code changes:

1. Go to your repository on GitHub
2. Navigate to Actions > Deploy
3. Click "Run workflow" and select the `main` branch

### Rollback

To roll back to a previous version:

```bash
# Find the commit to roll back to
git log --oneline -10

# Revert to a specific commit
git revert <commit-hash>
git push origin main
```

### Checking Deployment Status

Your sandbox health endpoint confirms the running version:

```bash
curl https://<your-sandbox>.dev.cds-megaproject.com/api/health
```

---

## 6. Using Claude Code in Your Sandbox

Claude Code is available as a development assistant within your sandbox
environment.

### Getting Started with Claude Code

1. Open your sandbox repository in a terminal
2. Run `claude` to start a Claude Code session
3. Claude Code has access to your project files and can:
   - Write and modify code
   - Run tests
   - Debug issues
   - Explain existing code

### Best Practices

- Use Claude Code for scaffolding new features, writing tests, and debugging
- Always review generated code before committing
- Run the test suite after any AI-generated changes
- Follow the project's existing coding standards (TypeScript strict mode,
  ESLint configuration)

### Example Workflows

**Generate a new API endpoint**:

```
> Create a new GET /api/users endpoint that queries the users table
> and returns paginated results with a limit parameter
```

**Write tests for existing code**:

```
> Write unit tests for the user registration handler in src/routes/users.ts
```

**Debug a failing test**:

```
> The test in tests/users.test.ts is failing with "connection refused".
> Help me diagnose and fix the issue.
```

---

## 7. Common Troubleshooting

### Application will not start locally

**Symptoms**: `npm run dev` fails or the server exits immediately.

**Checks**:
1. Verify Node.js version is 20+: `node --version`
2. Verify dependencies are installed: `rm -rf node_modules && npm install`
3. Check `.env` file exists with required variables
4. Check if port 3000 is already in use: `lsof -i :3000`

### Cannot connect to local database

**Symptoms**: Application logs show "connection refused" for PostgreSQL.

**Checks**:
1. Verify Docker is running: `docker ps`
2. Start the database: `docker compose up -d db`
3. Verify connection string in `.env`: should be `localhost:5432`
4. Check database logs: `docker compose logs db`
5. Reset the database: `docker compose down -v && docker compose up -d db`

### Deployment fails in GitHub Actions

**Symptoms**: GitHub Actions workflow shows red status.

**Checks**:
1. Check the Actions tab for the specific error
2. Common causes:
   - Lint errors: Run `npm run lint` locally and fix issues
   - Test failures: Run `npm test` locally
   - Build errors: Run `npm run build` locally
   - Docker build errors: Check the Dockerfile for syntax issues
3. If the ECR push fails, verify the GitHub Actions secrets are configured

### Sandbox URL returns 502/503

**Symptoms**: Your sandbox URL shows a bad gateway error.

**Checks**:
1. Verify the ECS task is running (check the portal sandbox details page)
2. Check if the application health check is passing
3. Review application logs in CloudWatch
4. The sandbox may have been auto-hibernated due to inactivity -- wake it
   from the portal

### Database migration fails

**Symptoms**: `npm run migrate` exits with an error.

**Checks**:
1. Verify the DATABASE_URL is correct
2. Check migration file SQL syntax
3. Verify the migration has not already been applied
4. Check for conflicting schema changes

### Running out of storage

**Symptoms**: S3 uploads fail or database inserts fail with disk space errors.

**Checks**:
1. Check your S3 usage in the portal sandbox details page
2. Clean up unnecessary files from S3
3. Run `VACUUM` on the database to reclaim space
4. If you consistently need more storage, request a tier upgrade through the
   portal

---

## 8. FAQ

**Q: How long does my sandbox last?**
A: Your sandbox duration is set when you create the request (1 week, 1 month,
3 months, 6 months, or ongoing). You will receive expiration reminders before
the end date.

**Q: Can I request more resources (CPU, memory, storage)?**
A: You can request a tier upgrade through the portal. This requires the same
approval workflow as the initial request.

**Q: What happens when my sandbox is hibernated?**
A: Hibernation stops the compute resources (ECS tasks) to save costs. Your
database and S3 data are preserved. Wake the sandbox from the portal to resume
work. Hibernation typically takes 1-2 minutes; waking takes 2-3 minutes.

**Q: Can I use external npm packages?**
A: Yes, you can install any npm packages. However, packages that require
outbound internet access (API calls to external services) need the
`external_api` optional service enabled. If you did not request this service,
outbound HTTP requests will be blocked.

**Q: How do I access my sandbox database from a local client?**
A: Direct database access from outside AWS is not available for security
reasons. Use the DevContainer or connect through the application code. For
ad-hoc queries, use the Express.js route handler pattern to expose a temporary
query endpoint (remove before committing).

**Q: Can I have multiple branches deployed?**
A: No, only the `main` branch is deployed to your sandbox environment. Use
feature branches for development and merge to `main` when ready to deploy.

**Q: What happens to my data after teardown?**
A: Before teardown, you must export your data. Exported data is available
for download for 30 days, then moved to cold storage for 1 year, then
permanently deleted.

**Q: Who do I contact for support?**
A: For platform issues, contact the Forge engineering team via the
`#forge-support` Slack channel. For sandbox-specific application issues,
consult your tech lead.

**Q: What are the sandbox resource limits?**

| Tier     | CPU (vCPU) | Memory (MB) | S3 (GB) | Database (GB) |
|----------|------------|-------------|---------|---------------|
| Starter  | 256        | 512         | 5       | 1             |
| Standard | 512        | 1024        | 25      | 5             |
| Power    | 1024       | 2048        | 100     | 20            |

**Q: Is my sandbox accessible from the public internet?**
A: Your sandbox URL is publicly accessible via HTTPS, but all endpoints require
the sandbox to be in ACTIVE status. There is no built-in authentication on your
sandbox application -- if you need authentication, implement it in your
application code.
