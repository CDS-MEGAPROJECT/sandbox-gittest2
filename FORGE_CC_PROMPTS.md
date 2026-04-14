# FORGE_CC_PROMPTS.md — Master Prompt Sequence

## How to Use This File

This file contains every Claude Code prompt for building CDS Forge, organized into
phases with dependency gates. Each prompt is self-contained — copy the section between
`--- START CC-XX ---` and `--- END CC-XX ---` markers and paste it into a Claude Code session.

**Progress tracking:** Mark each task as you complete it.
**Dependency gates:** Don't start a task until its prerequisites are marked done.

---

## Phase Map

```
PHASE A — Day 1 (all six run in parallel, zero dependencies between them)
  [_] CC-01  Next.js scaffold           → forge-platform base
  [_] CC-02  DynamoDB service layer      → merges into forge-platform
  [_] CC-03  Cognito auth flow           → merges into forge-platform
  [_] CC-04  Pulumi shared infra         → forge-infrastructure repo
  [_] CC-05  Design system               → merges into forge-platform
  [_] CC-06  Sandbox template repo       → forge-sandbox-template repo

GATE 1 — Merge CC-01 through CC-05 into forge-platform. Verify build passes.
  [_] Merge complete
  [_] npm run build passes
  [_] npm run lint clean

PHASE B — Days 3-5 (all four run in parallel, require Gate 1)
  [_] CC-07  Request wizard + validation
  [_] CC-08  Admin dashboard + queue
  [_] CC-09  User dashboard + cards
  [_] CC-10  Audit log + settings + email

GATE 2 — Merge Phase B. Full approval flow works end-to-end.
  [_] Merge complete

PHASE C — Days 6-10 (require Gate 2 + CC-04 deployed)
  [_] CC-11  Lambda handlers (validate, GitHub, notify)
  [_] CC-12  Lambda handlers (Pulumi provision, deploy, credentials)
  [_] CC-13  Step Functions ASL + rollback
  [_] CC-14  Auto-hibernate + wake + nightly shutdown

PHASE D — Days 11-15 (require Gate 3)
  [_] CC-15  Merge pipeline
  [_] CC-16  Export pipeline + Parquet
  [_] CC-17  Teardown pipeline

PHASE E — Days 16-20
  [_] CC-18  Security test suite
  [_] CC-19  Load testing + dashboards
  [_] CC-20  Documentation + runbooks
```

---

## PHASE A — Day 1 Parallel Sessions

═══════════════════════════════════════════════════════════════════
--- START CC-01: NEXT.JS SCAFFOLD ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform | **Dependencies:** None | **Duration:** ~25 min

## Context
You are building the portal application for CDS Forge — a self-service developer sandbox
provisioning platform for the nuclear industry.

## Task
Scaffold a complete Next.js 14+ project using the App Router. Every file should be a
working stub with proper TypeScript types and layout nesting.

## Technology (LOCKED)
- Next.js 14+ with App Router, TypeScript (strict), Tailwind CSS 3.4+
- shadcn/ui, Zod for validation, React Server Components, Server Actions

## Commands to Run First
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
npx shadcn@latest init -d
npx shadcn@latest add button card input label textarea select badge dialog dropdown-menu separator tabs toast avatar
```

## Directory Structure
```
src/app/
├── (auth)/login/page.tsx, verify-mfa/page.tsx, layout.tsx
├── (dashboard)/layout.tsx, page.tsx, sandboxes/(page, [id]/page, new/page), requests/page, profile/page
├── (admin)/layout.tsx, page.tsx, queue/page, sandboxes/(page, [id]/page), merges/page, users/page, settings/page, audit/page
├── api/auth/[...nextauth]/route.ts, sandboxes/(route, [id]/(route, approve, reject, hibernate, wake, export, teardown))
├── api/webhooks/(github, step-functions)/route.ts, api/health/route.ts
├── globals.css, layout.tsx, not-found.tsx
```

## Also Create
- `src/types/index.ts, sandbox.ts, user.ts, audit.ts` — full TypeScript interfaces
- `src/lib/constants.ts` — tier configs, status enum, service checklist
- `src/middleware.ts` — auth + role checks
- `.env.example` — all environment variables

## Types
```typescript
type SandboxStatus = 'DRAFT' | 'PENDING_TECH_LEAD' | 'MODIFICATIONS_REQUESTED' | 'PENDING_SENIOR_ADMIN'
  | 'APPROVED' | 'PROVISIONING' | 'PROVISIONING_FAILED' | 'ACTIVE' | 'HIBERNATED'
  | 'EXPORT_REQUESTED' | 'EXPORTING' | 'EXPORTED' | 'TEARDOWN_REQUESTED' | 'ARCHIVED';
type Tier = 'starter' | 'standard' | 'power';
type UserRole = 'user' | 'tech_lead' | 'senior_admin';
```

## Verification
Run `npm run build` — zero errors. Run `npm run lint` — fix all warnings.

═══════════════════════════════════════════════════════════════════
--- END CC-01 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-02: DYNAMODB SERVICE LAYER ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform (src/lib/db/) | **Dependencies:** None | **Duration:** ~30 min

## Task
Create typed DynamoDB service classes for three tables: ForgeRequests (PK: REQUEST#{id}, SK: METADATA, GSI on userId and status), ForgeAuditLog (PK: AUDIT#{type}#{id}, SK: {timestamp}#{eventId}, NO TTL), ForgeUsers (PK: USER#{sub}, SK: PROFILE).

## Files: src/lib/db/client.ts, requests.ts, audit.ts, users.ts, index.ts, schemas.ts

## Critical Requirements
1. **State machine validation on every transition** — valid paths only:
   DRAFT→PENDING_TECH_LEAD, PENDING_TECH_LEAD→PENDING_SENIOR_ADMIN|MODIFICATIONS_REQUESTED|REJECTED,
   MODIFICATIONS_REQUESTED→PENDING_TECH_LEAD, PENDING_SENIOR_ADMIN→APPROVED|REJECTED|PENDING_TECH_LEAD,
   APPROVED→PROVISIONING, PROVISIONING→ACTIVE|PROVISIONING_FAILED, ACTIVE→HIBERNATED|EXPORT_REQUESTED,
   HIBERNATED→ACTIVE, EXPORT_REQUESTED→EXPORTING, EXPORTING→EXPORTED,
   EXPORTED→TEARDOWN_REQUESTED, TEARDOWN_REQUESTED→ARCHIVED
2. **Every mutation writes an audit log** via DynamoDB TransactWrite
3. **Conditional expressions** on status updates to prevent race conditions
4. **Zod schemas** validate all inputs before DynamoDB writes
5. **updatedAt** set on every mutation

## Service Methods
RequestsService: create, getById, getByUserId, getByStatus, updateStatus, assignTechLead,
approveTechLead, approveAdmin, reject, requestModifications

## Verification
Write unit tests for state machine transitions (all valid + invalid), Zod validation, audit log format.

═══════════════════════════════════════════════════════════════════
--- END CC-02 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-03: COGNITO AUTH FLOW ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform (src/lib/auth/ + auth pages) | **Dependencies:** None | **Duration:** ~35 min

## Task
Implement Cognito authentication with mandatory TOTP MFA using next-auth v5 (AuthJS).

## Files
src/lib/auth/config.ts, cognito-provider.ts, cognito-client.ts, session.ts, types.ts
src/app/api/auth/[...nextauth]/route.ts
src/app/(auth)/login/page.tsx, verify-mfa/page.tsx, setup-mfa/page.tsx, layout.tsx
src/middleware.ts

## Auth Flow
1. Email + password → InitiateAuth (USER_SRP_AUTH)
2. Challenge SOFTWARE_TOKEN_MFA → redirect to /verify-mfa → RespondToAuthChallenge
3. Challenge MFA_SETUP → /setup-mfa → AssociateSoftwareToken → QR code → VerifySoftwareToken
4. Success → create NextAuth session → redirect to dashboard

## Session: 1hr access token, 30 day refresh, auto-refresh, role from custom:role attribute

## Session Utilities
```typescript
export async function requireAuth(): Promise<Session> { ... }
export async function requireRole(role: UserRole | UserRole[]): Promise<Session> { ... }
export async function getCurrentUser(): Promise<ForgeUser | null> { ... }
```

## Security: MFA mandatory, no self-registration, preventUserExistenceErrors, rate limiting, HttpOnly/Secure/SameSite=Strict cookies

## Login UX: Centered card, dark bg, FORGE wordmark, no "Sign up" or "Forgot password"
## MFA UX: 6-digit input, auto-focus, auto-submit, 30s countdown, max 3 attempts

## Verification
Test: login→MFA→dashboard, wrong password, wrong MFA 3x lockout, session expiry, non-admin on /admin

═══════════════════════════════════════════════════════════════════
--- END CC-03 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-04: PULUMI SHARED INFRASTRUCTURE ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-infrastructure (standalone) | **Dependencies:** None | **Duration:** ~45 min

## Setup
```bash
pulumi new aws-typescript --name forge-shared-infra --yes
npm install @pulumi/aws @pulumi/awsx @pulumi/pulumi
```

## Files
src/index.ts, config.ts, stacks/(networking, security, load-balancer, database, compute, dns, monitoring).ts
src/sandbox/index.ts (per-sandbox factory), helpers/(tags, naming).ts

## VPC: 10.0.0.0/16
Public (ALB+NAT): 10.0.1.0/24(a), 10.0.2.0/24(b)
Private App (ECS): 10.0.10.0/24(a), 10.0.11.0/24(b)
Private DB (Aurora): 10.0.20.0/24(a), 10.0.21.0/24(b)

## VPC Endpoints: Interface: ecr.api, ecr.dkr, secretsmanager, logs, sts, kms. Gateway: s3, dynamodb

## Security Groups
forge-alb-sg: in HTTPS/443 from 0.0.0.0/0, out 3000→forge-ecs-sg
forge-ecs-sg: in 3000 from forge-alb-sg, out 5432→forge-rds-sg + 443→VPC endpoints
forge-rds-sg: in 5432 from forge-ecs-sg, out none

## ALB: shared, HTTPS/443, ACM wildcard *.dev.cds-megaproject.com, default 404
## Aurora: PostgreSQL 15, min ACU 0 (scale-to-zero), max ACU 8, pgAudit, deletion protection
## ECS: Fargate + Fargate Spot, Container Insights, Execute Command
## ECR: forge-sandbox-base, scan on push, keep last 10
## Route 53: wildcard A → ALB

## Per-Sandbox Stack Template (sandbox/index.ts)
```typescript
const TIER_CONFIGS = {
  starter:  { cpu: 256,  memory: 512,  s3LimitGb: 5,   dbLimitGb: 1  },
  standard: { cpu: 512,  memory: 1024, s3LimitGb: 25,  dbLimitGb: 5  },
  power:    { cpu: 1024, memory: 2048, s3LimitGb: 100, dbLimitGb: 20 },
};
```
Creates: ECS Task Def, Service (Fargate Spot), ALB Target Group, Listener Rule,
Log Group, IAM Task Role (ABAC). Container: readonlyRootFilesystem, user 1000:1000, drop ALL caps.

## Tags (MANDATORY): forge:Environment, forge:ManagedBy, forge:Project, forge:CostCenter
## GovCloud: every service must be compatible. No App Runner, No Amplify Hosting.
## Verify: `pulumi preview` succeeds. ~25-35 resources.

═══════════════════════════════════════════════════════════════════
--- END CC-04 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-05: DESIGN SYSTEM ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform | **Dependencies:** None | **Duration:** ~35 min

## Aesthetic: Industrial-premium dark mode. Palantir meets Bloomberg. NOT consumer SaaS.

## Colors (Dark Mode)
BG: #0A0E17 (primary), #111827 (card), #1F2937 (elevated)
Text: #F9FAFB (primary), #9CA3AF (muted), #6B7280 (subtle)
Accents: Electric blue #3B82F6, Forge orange #F97316, Success #10B981, Warning #F59E0B, Danger #EF4444, Info #06B6D4
Status: Draft=gray, Pending=amber, Active=green, Hibernated=blue, Provisioning=cyan+pulse, Failed=red, Archived=muted

## Typography: Outfit (headings/body 300-700), JetBrains Mono (code 400-500). NO Inter/Roboto/Arial.

## Files
tailwind.config.ts, src/app/globals.css
src/components/forge/: StatusBadge, TierBadge, SidebarNav, TopBar, DashboardShell,
PageHeader, EmptyState, LoadingSkeleton, StatCard, Logo

## Sidebar Nav: User routes (Dashboard, My Sandboxes, New Request, My Requests, Profile)
Admin routes (Admin Home, Approval Queue+badge, All Sandboxes, Merge Mgmt, Users, Settings, Audit Log)
Icons: Lucide React. Logo: SVG "FORGE" wordmark + geometric anvil mark.

## Verify: Create /dev/style-guide page showing all components in gallery.

═══════════════════════════════════════════════════════════════════
--- END CC-05 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-06: SANDBOX TEMPLATE REPO ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-sandbox-template (standalone) | **Dependencies:** None | **Duration:** ~30 min

## Task
Create complete GitHub template repo: DevContainer (typescript-node:20 + Claude Code),
GitHub Actions (deploy to ECR/ECS, Trivy+CodeQL security scan), Express.js starter app,
multi-stage Dockerfile, CLAUDE.md with template variables.

## Files
.devcontainer/devcontainer.json + post-create.sh
.github/workflows/deploy.yml + security-scan.yml
src/index.ts, routes/(health, index, example).ts, db/(client, migrate).ts + migrations/001_initial.sql
src/utils/logger.ts, tests/health.test.ts, CLAUDE.md, Dockerfile, docker-compose.yml,
package.json, tsconfig.json, .eslintrc.json, .prettierrc, .gitignore, README.md

## CLAUDE.md template variables: {{SANDBOX_NAME}}, {{PROJECT_DESCRIPTION}}, {{TIER}},
{{TIER_VCPU}}, {{TIER_MEMORY}}, {{TIER_S3_LIMIT}}, {{TIER_DB_LIMIT}}

## Dockerfile: multi-stage Node.js 20 Alpine, user 1000:1000, HEALTHCHECK, read-only rootfs
## App: Express with health check (/api/health), welcome page, example DB query,
structured JSON logging, graceful SIGTERM, PostgreSQL with retry

## Verify: npm run build, npm test, docker build, health returns 200.

═══════════════════════════════════════════════════════════════════
--- END CC-06 ---
═══════════════════════════════════════════════════════════════════

---

## GATE 1 — Merge CC-01 through CC-05 into forge-platform. Run @forge-reviewer. Verify npm run build passes.

---

## PHASE B — Days 3-5 Portal Pages

═══════════════════════════════════════════════════════════════════
--- START CC-07: REQUEST WIZARD ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform | **Requires:** Gate 1 | **Duration:** ~30 min

## Task: Build 4-step sandbox request wizard at src/app/(dashboard)/sandboxes/new/

## Files: page.tsx, _components/(WizardStepper, StepBasics, StepResources, StepRequirements,
StepReview, TierCard, ServiceCheckbox).tsx, _actions/submit-request.ts, _schemas/request-schema.ts

## Step 1 Basics: sandboxName (lowercase/numbers/hyphens, max 20, live subdomain preview,
debounced uniqueness check), description (50-500 chars), objectives (50-500 chars)

## Step 2 Resources: Tier cards (Starter 0.25CPU/512MB/$5S3, Standard 0.5/1GB/25GB,
Power 1.0/2GB/100GB — default Standard). Services checklist (PostgreSQL/S3/API included;
optional: scheduled jobs, WebSocket, Redis, queue, external API, large file processing).
Duration radio: 1 week/1 month/3 months/6 months/ongoing.

## Step 3: Special requirements (optional, skip button)
## Step 4: Review with edit links, subdomain preview, submit with confirmation

## Server Action: Zod validate → check name availability → check maxSandboxes →
create in DynamoDB as PENDING_TECH_LEAD → write audit log → send SES to tech leads

## UX: stepper + next/back, state persists across steps, validate on "Next" click

═══════════════════════════════════════════════════════════════════
--- END CC-07 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-08: ADMIN DASHBOARD + APPROVAL QUEUE ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform | **Requires:** Gate 1 | **Duration:** ~40 min

## Task: Admin interface — approval queue, sandbox management, user management.

## Files
src/app/(admin)/layout.tsx, page.tsx (summary stats)
queue/page.tsx + _components/(QueueFilters, RequestCard, ApprovalActions, ReviewNotes, ProvisioningTracker)
sandboxes/page.tsx + [id]/page.tsx + _components/(SandboxTable, SandboxActions, ResourceUsage, ActivityTimeline)
users/page.tsx + _components/(UserTable, InviteUserDialog)
_actions/(approve-request, reject-request, request-modifications, sandbox-actions, user-actions).ts

## Admin Home: pending count (tech lead/admin split), active sandboxes, hibernated, monthly cost, activity feed
## Queue: filter tabs (All Pending/Awaiting My Review/Recently Processed), expandable request cards
## Actions: PENDING_TECH_LEAD+tech_lead→Approve/Modify/Reject. PENDING_SENIOR_ADMIN+senior_admin→Approve/SendBack/Reject
## Provisioning Tracker: 5 steps (GitHub→AWS→Deploy→Creds→Notify) with pending/in-progress/complete/failed
## Sandbox Management: metadata, URLs, resource gauges, cost, timeline, Hibernate/Wake/Export/Teardown buttons
## User Management: table with invite, edit role, deactivate
## All destructive actions require confirmation dialogs. 30s auto-refresh on queue.

═══════════════════════════════════════════════════════════════════
--- END CC-08 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-09: USER DASHBOARD + SANDBOX CARDS ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform | **Requires:** Gate 1 | **Duration:** ~30 min

## Task: User-facing dashboard. Users are NOT technical — dead simple.

## Files
src/app/(dashboard)/page.tsx, layout.tsx
sandboxes/page.tsx + [id]/page.tsx + _components/(SandboxCard, SandboxGrid, QuickActions, ConnectionInfo)
requests/page.tsx + _components/(RequestTimeline, RequestList)
profile/page.tsx + _components/ProfileForm

## SandboxCard: name, status badge, description (2-line truncate), tier badge, last activity,
quick actions (Open Codespace/Visit Site/View Repo). Card states: Active=green border,
Hibernated=blue+dimmed, Provisioning=cyan+pulse, Failed=red, Archived=gray collapsed.

## Sandbox Detail: tabs (Overview/Connection Details/Activity). Connection Details: DATABASE_URL,
S3 bucket/prefix, API URL with copy-to-clipboard. Sensitive values masked with "Reveal".

## Requests: RequestTimeline (●Submitted──○Tech Lead──○Admin──○Provisioning──○Active).
Rejected shows red X with reason. MODIFICATIONS_REQUESTED shows notes + "Edit & Resubmit".

## Empty state: centered illustration + "Request Your First Sandbox" CTA.
## Data fetching: React Server Components. Mobile: single column.

═══════════════════════════════════════════════════════════════════
--- END CC-09 ---
═══════════════════════════════════════════════════════════════════


═══════════════════════════════════════════════════════════════════
--- START CC-10: AUDIT LOG + SETTINGS + EMAIL ---
═══════════════════════════════════════════════════════════════════

**Repo:** forge-platform | **Requires:** Gate 1 | **Duration:** ~35 min

## Task: Audit log viewer, admin settings, all SES email templates. Nuclear regulatory context.

## Files
src/app/(admin)/audit/page.tsx + _components/(AuditTable, AuditFilters, AuditDetail)
src/app/(admin)/settings/page.tsx + _components/(TierConfig, PlatformHealth, DangerZone)
src/lib/email/ses-client.ts, send.ts, index.ts
src/lib/email/templates/(base-layout, request-submitted, tech-lead-approved, request-approved,
sandbox-ready, request-rejected, modifications-requested, sandbox-hibernated, export-complete,
provisioning-failed, welcome).ts

## Audit Table: timestamp, action, entity, actor, state change, IP.
Filters: entity type, action type, actor search, date range, free text.
Cursor-based pagination (DynamoDB LastEvaluatedKey). CSV export via Server Action.

## Settings: tier config table, notification toggles, platform health indicators,
danger zone (Hibernate All with typed confirmation).

## Email Templates: dark header FORGE wordmark, white content, plain text fallback.
Responsive for Gmail/Outlook/Apple Mail.

## Email Triggers: request submitted→tech leads, tech lead approved→senior admins,
fully approved→user, sandbox ready→user, rejected→user, modifications→user,
auto-hibernated→owner, export complete→owner+admin, provisioning failed→admins,
account created→new user.

## EmailService: send(to, template), sendToRole(role, template), sendToAdmins(template)

═══════════════════════════════════════════════════════════════════
--- END CC-10 ---
═══════════════════════════════════════════════════════════════════

---

## GATE 2 — Merge Phase B. Run @forge-reviewer. Verify full approval flow end-to-end.

---

## PHASES C-E

Prompts CC-11 through CC-20 cover provisioning engine, merge/export, and hardening.
To generate: come back to the Claude.ai project chat and say:
- "Generate CC-11 through CC-14" (provisioning engine)
- "Generate CC-15 through CC-17" (merge and export)
- "Generate CC-18 through CC-20" (hardening)
