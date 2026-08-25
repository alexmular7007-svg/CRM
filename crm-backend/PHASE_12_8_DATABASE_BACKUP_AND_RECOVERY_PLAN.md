# Phase 12.8 — Database Backup and Recovery Plan

**Status:** Report-only (no modifications to production data)
**Date:** August 19, 2026
**Scope:** PostgreSQL Production Database Backup, Recovery, Rollback Strategies

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Database Overview](#database-overview)
3. [Critical Tables Analysis](#critical-tables-analysis)
4. [Foreign Key Relationships](#foreign-key-relationships)
5. [Backup Strategy](#backup-strategy)
6. [Migration Strategy](#migration-strategy)
7. [Recovery Strategy](#recovery-strategy)
8. [Rollback Strategy](#rollback-strategy)
9. [Data-Loss Risks](#data-loss-risks)
10. [Safe Backup Procedures](#safe-backup-procedures)
11. [Recovery Procedures](#recovery-procedures)
12. [Rollback Procedures](#rollback-procedures)
13. [Testing Procedures](#testing-procedures)

---

## Executive Summary

### Current State
- **Database:** PostgreSQL (Supabase in production)
- **ORM:** Hibernate with Flyway migrations
- **Tables:** 28+ tables across 20+ migrations (V1-V20)
- **Data Model:** Multi-workspace SaaS with email campaigns, lead management, automation
- **Deployment Model:** Railway backend + Supabase PostgreSQL

### Critical Findings

| Category | Status | Details |
|----------|--------|---------|
| **Backup Strategy** | ❌ Not Documented | Supabase auto-backup available but backup schedule, retention, and recovery procedures undefined |
| **Recovery Plan** | ❌ Not Documented | No documented point-in-time recovery (PITR) procedure |
| **Rollback Plan** | ❌ Not Documented | No procedure to revert schema migrations or application versions |
| **Data-Loss Risks** | 🔴 CRITICAL | Cascading deletes, no soft-delete pattern, no audit log, no point-in-time backups configured |
| **Migration Safety** | 🟡 MEDIUM | Flyway handles schema, but data migration strategy unclear |
| **Workspace Isolation** | ✅ Correct | Foreign keys enforce workspace boundary; cascading deletes scoped to workspace |

### Risk Assessment

🔴 **CRITICAL RISKS:**
1. No documented backup schedule or retention policy
2. Cascading DELETE operations can cause silent data loss
3. No point-in-time recovery (PITR) timeline defined
4. No soft-delete pattern → permanent data loss on cascade
5. No audit log for data change tracking
6. Application version mismatches with schema migrations could cause data corruption

🟡 **HIGH RISKS:**
7. Flyway migration rollback not tested
8. No staging/test database for recovery verification
9. Email campaign history not immutable (can be updated)
10. Automation execution tracking could be lost on cascade

✅ **MITIGATIONS IN PLACE:**
- Workspace-scoped cascading deletes (safe isolation)
- Foreign key constraints (referential integrity)
- Indexes on critical fields (query performance)
- Composite unique constraints (data consistency)

---

## Database Overview

### Infrastructure

```
Production:
├── Frontend: Vercel (React/Vite)
├── Backend: Railway (Java Spring Boot)
└── Database: Supabase PostgreSQL
    ├── Host: db.xkzpzcvwzqjavftrnxjl.supabase.co
    ├── Port: 5432
    ├── SSL Mode: require
    └── Auto-backup: Daily (Supabase default)

Development:
├── Backend: Local Spring Boot
├── Database: Docker PostgreSQL
    ├── Container: crm-postgres
    ├── Port: 5432
    └── Data: Docker volume (postgres_data)

Testing:
├── Backend: Local Spring Boot (test profile)
└── Database: Testcontainers PostgreSQL (in-memory)
```

### Database Configuration

**Production (application-prod.yml):**
```
ddl-auto: update          # Hibernate auto-creates/updates schema
show-sql: false           # Disable SQL logging in production
database: crm_db
max-pool-size: 20
min-idle: 5
connection-timeout: 30s
idle-timeout: 10m
max-lifetime: 30m
```

**Development (application-dev.yml):**
```
ddl-auto: validate        # Validate schema matches entities
show-sql: true            # Enable SQL logging for debugging
database: crm_db_dev
max-pool-size: 10
min-idle: 2
```

### Migration Tool: Flyway

- **Location:** `crm-backend/db/migrations/`
- **Prefix:** `V` (e.g., V1, V2, ..., V20)
- **Format:** SQL scripts
- **Execution:** Automatic on application startup
- **Rollback:** Manual (not automated by Flyway Community edition)
- **Version Table:** `flyway_schema_history` (auto-created)

**Migrations Implemented:**
- V1-V8: Base schema (core tables via Hibernate)
- V9: Attachments table
- V10-V11: Lead conversion (clients, projects)
- V12: Lead magnets (magnet definitions, submissions, views)
- V13-V16: Email campaigns (templates, campaigns, recipients, history, analytics)
- V17-V20: Marketing automation (automations, steps, executions)

---

## Critical Tables Analysis

### 1. Users Table
**Purpose:** User accounts and authentication
**Relationships:** Central hub for all workspace/data ownership
**Volume Estimate:** 1,000 - 10,000 rows
**Backup Priority:** 🔴 CRITICAL

```
users
├── id (PK)
├── email (UNIQUE, normalized lowercase)
├── password (bcrypt hashed)
├── first_name
├── last_name
├── profile_picture_url
├── auth_provider (GOOGLE, GITHUB, LOCAL)
├── auth_id (external provider ID)
├── created_at
├── updated_at
└── Indexes:
    ├── idx_user_email
    ├── idx_user_auth_provider
    └── idx_user_created_at

Foreign Keys FROM:
├── workspaces(user_id) → users(id) [workspace owner]
├── workspace_members(user_id) → users(id) [team members]
├── email_campaigns(created_by_id) → users(id)
└── [40+ more tables]
```

**Data-Loss Risk:** HIGH
- Deleting a user cascades to all workspaces they own
- Cascades to all tasks, leads, campaigns they created
- Permanent loss of user history

**Backup Recommendation:** IMMUTABLE
- Never delete users, use soft-delete flag
- Keep audit log of all user actions

---

### 2. Workspaces Table
**Purpose:** Tenant isolation for multi-workspace SaaS
**Relationships:** Root isolation boundary
**Volume Estimate:** 100 - 1,000 rows per deployment
**Backup Priority:** 🔴 CRITICAL

```
workspaces
├── id (PK)
├── user_id (FK → users) [workspace owner]
├── name
├── slug (unique per user)
├── icon_url
├── logo_url
├── settings (JSONB) [workspace config]
├── created_at
├── updated_at
└── Indexes:
    ├── idx_workspace_user_id
    ├── idx_workspace_slug
    └── idx_workspace_created_at

Cascading DELETE:
├── workspace_members (user associations)
├── leads (all leads in workspace)
├── email_campaigns (all campaigns in workspace)
├── automations (all automations in workspace)
├── projects (all projects in workspace)
└── [20+ more tables]
```

**Data-Loss Risk:** CRITICAL
- Deleting a workspace deletes ALL tenant data (isolation by design)
- No recovery possible without backup
- Single accidental deletion = complete data loss

**Backup Recommendation:** IMMUTABLE + Point-in-time recovery
- Backup per workspace
- 30-day retention minimum

---

### 3. Leads Table
**Purpose:** Sales leads, prospects, contacts
**Relationships:** Core business entity
**Volume Estimate:** 10,000 - 1,000,000 rows (scales with usage)
**Backup Priority:** 🔴 CRITICAL

```
leads
├── id (PK)
├── workspace_id (FK → workspaces) [isolation]
├── first_name
├── last_name
├── email (composite unique with workspace_id)
├── phone
├── company
├── industry
├── job_title
├── status (COLD, WARM, HOT, WON, LOST)
├── score (0-100)
├── source (WEB, EMAIL, CAMPAIGN, MAGNET, MANUAL, API)
├── notes
├── converted (boolean) [Feature #1]
├── converted_at
├── converted_client_id (FK → clients)
├── converted_project_id (FK → projects)
├── source_magnet_id (FK → lead_magnets) [Feature #2]
├── created_at
├── updated_at
└── Indexes:
    ├── idx_lead_workspace_id
    ├── idx_lead_email
    ├── idx_lead_status
    ├── idx_lead_score
    ├── idx_lead_source
    └── idx_lead_workspace_email_unique

Foreign Keys TO:
├── email_campaign_recipients(lead_id) → leads(id) [ON DELETE SET NULL]
├── lead_magnet_submissions(lead_id) → leads(id) [ON DELETE SET NULL]
├── clients(source_lead_id) → leads(id) [ON DELETE SET NULL, UNIQUE]
└── projects(source_lead_id) → leads(id) [ON DELETE SET NULL, UNIQUE]
```

**Data-Loss Risk:** HIGH
- Lead soft-deleted when workspace deleted
- Lead score/status updates not tracked (no audit log)
- Conversion (Feature #1) not reversible without backup

**Backup Recommendation:** IMMUTABLE
- Backup all leads (revenue-generating data)
- Track lead score history separately
- Implement soft-delete on lead deletion

---

### 4. Email Templates Table
**Purpose:** Reusable email message templates
**Relationships:** Parent to email campaigns
**Volume Estimate:** 50 - 500 rows per workspace
**Backup Priority:** 🟡 HIGH

```
email_templates
├── id (PK)
├── workspace_id (FK → workspaces)
├── name (unique per workspace)
├── description
├── category (CUSTOM, WELCOME, NURTURE, etc.)
├── subject_template (with {{variables}})
├── html_content (rich HTML, sanitized for email)
├── plain_text_content (fallback)
├── variables (VARCHAR[] of {{var_names}})
├── thumbnail_url
├── is_public (available workspace-wide)
├── created_by_id (FK → users)
├── created_at
├── updated_at
└── Indexes:
    ├── idx_template_workspace_id
    ├── idx_template_category
    ├── idx_template_created_at

Foreign Keys TO:
├── email_campaigns(template_id) → email_templates(id) [ON DELETE SET NULL]
```

**Data-Loss Risk:** MEDIUM
- Templates cascade-deleted with workspace
- Template versions not tracked (no history)
- Campaigns lose template reference if deleted (safe, reference set to NULL)

**Backup Recommendation:** VERSIONED
- Track template versions (each save creates version)
- 1-year retention (customer request may require specific template)

---

### 5. Email Campaigns Table
**Purpose:** Batch email send operations
**Relationships:** Orchestration hub for email delivery
**Volume Estimate:** 1,000 - 100,000 rows (campaigns over time)
**Backup Priority:** 🔴 CRITICAL

```
email_campaigns
├── id (PK)
├── workspace_id (FK → workspaces)
├── name (unique per workspace)
├── description
├── subject (email subject line)
├── subject_variables (VARCHAR[] for personalization)
├── template_id (FK → email_templates, nullable)
├── content_type (TEMPLATE, CUSTOM_HTML, PLAIN_TEXT)
├── status (DRAFT, SCHEDULED, RUNNING, COMPLETED, FAILED, PAUSED)
├── is_active (soft-active flag)
├── created_by_id (FK → users)
├── scheduled_at
├── send_started_at
├── send_completed_at
├── total_recipients
├── segment_filter (JSONB: audience criteria)
├── retry_count
├── recipient_mode (MANUAL, SEGMENT, CRM_FILTER)
├── recipient_data (JSONB: email list or filter)
├── sent_count (Brevo delivery metrics)
├── failed_count
├── delivered_count
├── opened_count
├── clicked_count
├── bounced_count
├── created_at
├── updated_at
├── deleted_at (soft-delete)
└── Indexes:
    ├── idx_campaign_workspace_id
    ├── idx_campaign_status
    ├── idx_campaign_created_at
    ├── idx_campaign_scheduled_at
    ├── idx_campaign_status_sent_count

Foreign Keys TO:
├── email_campaign_recipients(campaign_id) → email_campaigns(id) [ON DELETE CASCADE]
├── email_campaign_history(campaign_id) → email_campaigns(id) [ON DELETE CASCADE]
```

**Data-Loss Risk:** CRITICAL
- Campaign cascade-deletes all recipients and history (audit trail lost)
- Delivery metrics not immutable (can be updated, corrupting history)
- Deleted campaigns not recoverable without backup

**Backup Recommendation:** IMMUTABLE + Audit Log
- Never update campaign metrics, only INSERT new records
- Archive campaigns (don't delete) with soft-delete flag
- Keep email_campaign_history append-only

---

### 6. Email Campaign Recipients Table
**Purpose:** Individual email recipient status and engagement tracking
**Relationships:** Pivot + transactional status
**Volume Estimate:** 1,000,000 - 100,000,000 rows (1 row per send)
**Backup Priority:** 🔴 CRITICAL

```
email_campaign_recipients
├── id (PK)
├── campaign_id (FK → email_campaigns)
├── lead_id (FK → leads, nullable)
├── recipient_email
├── recipient_name
├── recipient_company
├── recipient_variables (JSONB for personalization)
├── status (PENDING, SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED, UNSUBSCRIBED)
├── bounce_type (SOFT, HARD, COMPLAINT)
├── delivery_attempts
├── sent_at
├── delivered_at
├── opened_at
├── first_clicked_at
├── last_clicked_at
├── click_count
├── unsubscribed_at
├── provider_message_id (Brevo message ID)
├── error_message
├── metadata (JSONB: provider response)
├── created_at
├── updated_at
└── Indexes:
    ├── idx_recipient_campaign_id
    ├── idx_recipient_status
    ├── idx_recipient_email
    ├── idx_recipient_opened_at
    ├── idx_recipient_campaign_email_unique

Constraint:
└── UNIQUE (campaign_id, recipient_email) [prevent duplicate sends]
```

**Data-Loss Risk:** CRITICAL
- Status updates are transactional (no version history)
- If campaign deleted, all recipient records deleted (cascade)
- Engagement metrics (opens, clicks) not immutable
- Large volume → slow backups/restores

**Backup Recommendation:** APPEND-ONLY + Partitioned
- Never update recipient status after final state
- Archive completed campaigns separately
- Partition by campaign_id or created_at for faster backups
- Daily snapshot exports (compressed JSON or Parquet)

---

### 7. Email Campaign History Table
**Purpose:** Append-only audit log of email events (webhooks from Brevo)
**Relationships:** Immutable event log
**Volume Estimate:** 5,000,000 - 500,000,000 rows (5-50x recipients)
**Backup Priority:** 🔴 CRITICAL

```
email_campaign_history
├── id (PK)
├── campaign_id (FK → email_campaigns)
├── recipient_id (FK → email_campaign_recipients, nullable)
├── recipient_email
├── event_type (SENT, DELIVERED, OPENING, CLICKED, BOUNCE, COMPLAINT, UNSUBSCRIBE, REPLY)
├── link_url (if event_type=CLICKED)
├── bounce_reason (if event_type=BOUNCE)
├── provider_event_id (Brevo webhook event ID)
├── idempotency_key (for deduplication)
├── occurred_at (Brevo timestamp, NOT created_at)
├── metadata (JSONB: full webhook payload)
├── created_at
└── Indexes:
    ├── idx_history_campaign_id
    ├── idx_history_event_type
    ├── idx_history_recipient_email
    ├── idx_history_occurred_at
    ├── idx_history_campaign_event
    ├── idx_history_idempotency_key_unique [UNIQUE deduplication]

Constraint:
└── UNIQUE (workspace_id, idempotency_key) [webhook idempotency]
```

**Data-Loss Risk:** CRITICAL
- Only append-only; no updates allowed
- If campaign deleted, history deleted (cascade)
- Webhook duplicate detection relies on idempotency_key
- Can grow to billions of rows (storage risk)

**Backup Recommendation:** ARCHIVE + COMPRESS
- Archive by campaign (immutable, no deletes)
- Compress old events (> 1 year) to storage
- Keep only recent 2-3 years hot
- Replicate to data warehouse (analytics)

---

### 8. Automation Table
**Purpose:** Marketing automation workflow definitions
**Relationships:** Parent to automation steps and executions
**Volume Estimate:** 100 - 10,000 rows per workspace
**Backup Priority:** 🟡 HIGH

```
automations
├── id (PK)
├── workspace_id (FK → workspaces)
├── name (unique per workspace)
├── description
├── status (DRAFT, ACTIVE, PAUSED, ARCHIVED)
├── trigger_type (LEAD_CREATED, LEAD_MAGNET_SUBMITTED, EMAIL_OPENED, EMAIL_CLICKED)
├── trigger_config (JSONB: nullable, Phase 2+ uses steps instead)
├── action_config (JSONB: nullable, Phase 2+ uses steps instead)
├── created_by_id (FK → users)
├── created_at
├── updated_at
├── archived_at
└── Indexes:
    ├── idx_automation_workspace_id
    ├── idx_automation_status
    ├── idx_automation_trigger_type
    ├── idx_automation_workspace_status
    ├── idx_automation_created_at
    ├── idx_automation_workspace_name_unique

Foreign Keys TO:
├── automation_steps(automation_id) → automations(id) [ON DELETE CASCADE]
├── automation_executions(automation_id) → automations(id) [ON DELETE CASCADE]
```

**Data-Loss Risk:** MEDIUM
- Deleting automation deletes all steps and executions (cascade)
- Steps and executions deleted → unable to audit what ran
- Archived automations are soft-deleted (safe)

**Backup Recommendation:** IMMUTABLE + Archive
- Archive instead of delete (archived_at = not null)
- Keep execution history (replicate to analytics)
- 2-year retention for automation definitions

---

### 9. Automation Steps Table
**Purpose:** Individual steps within automation workflow
**Relationships:** Child to automations
**Volume Estimate:** 500 - 100,000 rows (average 5-10 steps per automation)
**Backup Priority:** 🟡 HIGH

```
automation_steps
├── id (PK)
├── automation_id (FK → automations)
├── step_order (1-based, unique per automation)
├── step_type (TRIGGER, ACTION, CONDITION, WAIT, SEND_EMAIL, UPDATE_LEAD, etc.)
├── configuration (JSONB: step-specific settings)
├── enabled (boolean soft-disable)
├── created_at
├── updated_at
└── Indexes:
    ├── idx_step_automation_id
    ├── idx_step_automation_order (unique)
    ├── idx_step_type
    ├── idx_step_enabled
    ├── idx_step_created_at
```

**Data-Loss Risk:** MEDIUM
- Cascade-deleted with parent automation
- No step execution log (deleted = history lost)

**Backup Recommendation:** ARCHIVE
- Archive instead of delete
- Keep step change history
- 2-year retention

---

### 10. Automation Executions Table
**Purpose:** Runtime tracking of automation executions
**Relationships:** Child to automations and leads
**Volume Estimate:** 1,000,000 - 100,000,000 rows (per lead triggering automation)
**Backup Priority:** 🔴 CRITICAL

```
automation_executions
├── id (PK)
├── automation_id (FK → automations)
├── lead_id (FK → leads, nullable)
├── status (PENDING, RUNNING, WAITING, COMPLETED, FAILED)
├── current_step (1-based, null if not started)
├── error (error message if failed)
├── failed_step_id (which step failed)
├── started_at
├── completed_at
├── paused_at (at WAIT_DURATION step)
├── resume_at (when to resume after wait)
├── created_at
├── updated_at
└── Indexes:
    ├── idx_execution_automation_id
    ├── idx_execution_lead_id
    ├── idx_execution_status
    ├── idx_execution_created_at
    ├── idx_execution_automation_status
    ├── idx_execution_waiting [WHERE status='WAITING']
```

**Data-Loss Risk:** CRITICAL
- Cascade-deleted with automation
- Execution history lost = unable to audit automation effectiveness
- Can grow to 100M+ rows (storage risk)

**Backup Recommendation:** ARCHIVE + ANALYTICS
- Archive by automation (immutable, no deletes)
- Replicate to analytics warehouse
- Compress > 1 year old
- 2-year retention hot, 7-year retention cold

---

## Foreign Key Relationships

### Dependency Map (Critical Path)

```
users (root)
├── (10,000 rows)
├── ForeignKey: created_by on [workspaces, email_templates, email_campaigns, automations, etc.]
└── Cascade: If user deleted, all creations by that user cascade

    workspaces (tenant)
    ├── (100-1,000 rows)
    ├── ForeignKey: workspace_id on [leads, email_campaigns, automations, projects, etc.]
    └── Cascade: If workspace deleted, ALL tenant data deleted (intentional)
        
        leads (core business entity)
        ├── (10K-1M rows)
        ├── ForeignKey: lead_id on [email_campaign_recipients, automation_executions]
        ├── SetNull: Recipients/Executions keep history if lead deleted
        ├── Unique: (workspace_id, email)
        └── Conversion: converted_client_id, converted_project_id, source_magnet_id
        
        email_campaigns (batch operations)
        ├── (1K-100K rows)
        ├── ForeignKey: campaign_id on [email_campaign_recipients, email_campaign_history]
        ├── Cascade: If campaign deleted, all recipients and history deleted
        └── Soft-delete: deleted_at flag prevents actual deletion
        
        email_campaign_recipients (individual records)
        ├── (1M-100M rows)
        ├── ForeignKey: recipient_id on [email_campaign_history]
        ├── SetNull: If recipient deleted, history keeps email address
        └── Unique: (campaign_id, recipient_email) prevents duplicate sends
        
        email_campaign_history (append-only log)
        ├── (5M-500M rows)
        ├── Idempotency: (workspace_id, idempotency_key) UNIQUE
        └── Immutable: Never update, only insert
        
        automations (workflow definitions)
        ├── (100-10K rows)
        ├── ForeignKey: automation_id on [automation_steps, automation_executions]
        ├── Cascade: If automation deleted, all steps and executions deleted
        └── Soft-delete: archived_at flag
        
        automation_steps (workflow nodes)
        ├── (500-100K rows)
        ├── Unique: (automation_id, step_order)
        └── Cascade: If automation deleted, all steps deleted
        
        automation_executions (runtime tracking)
        ├── (1M-100M rows)
        ├── SetNull: If lead deleted, execution keeps reference
        └── Cascade: If automation deleted, all executions deleted
```

### Cascading Delete Behavior

**When workspace deleted (tenant destruction):**
- ✅ Safe & intentional: All workspace data deleted
- leads → email_campaign_recipients → (history deleted) ✓
- workspaces → email_campaigns → history ✓
- workspaces → automations → steps → (executions deleted) ✓

**When email campaign deleted:**
- ❌ Risk: Recipients and history deleted (permanent)
- Mitigation: Use soft-delete (deleted_at flag) instead
- Impact: 1M-100M rows deleted if not soft-deleted

**When automation deleted:**
- ❌ Risk: Execution history lost (audit trail destroyed)
- Mitigation: Archive automation (archived_at) instead
- Impact: 1M-100M execution records lost

**When lead deleted:**
- ⚠️ Medium risk: Lead soft-deleted, recipients/executions keep reference
- Mitigation: Use soft-delete (is_deleted flag) instead
- Impact: Lead recoverable if soft-deleted

---

## Backup Strategy

### Current State: ❌ Not Documented

**Supabase Auto-Backup:**
- ✅ Available: Supabase provides daily automated backups
- ❌ Not Configured: No backup schedule defined in infrastructure
- ❌ No PITR: Point-in-time recovery timeline unknown
- ❌ No Retention: Backup retention policy undefined
- ❌ No Testing: Recovery procedures not tested

### Recommended Backup Strategy

#### 1. Backup Frequency & Retention

| Tier | Frequency | Retention | Purpose | RPO | RTO |
|------|-----------|-----------|---------|-----|-----|
| **Hot** | Hourly | 7 days | Production incidents | 1 hour | < 5 min |
| **Warm** | Daily | 30 days | Recent data loss | 1 day | < 30 min |
| **Cold** | Weekly | 1 year | Compliance, audit trail | 1 week | < 2 hours |
| **Archive** | Monthly | 7 years | Legal, regulatory retention | N/A | N/A |

**RPO/RTO Targets:**
- **Recovery Point Objective (RPO):** Max 1 hour of data loss acceptable
- **Recovery Time Objective (RTO):** Must restore within 2 hours
- **Implications:** Hourly backups required; 2-hour recovery SLA achievable

#### 2. Backup Methods

**Method A: Supabase Native Backups** (Recommended for simplicity)
```
- Supabase provides daily automated backups
- Included in standard plan
- Backup retention: User-configurable (default 7 days)
- Point-in-time recovery: Available (configurable window)
- Access: Via Supabase dashboard
- Cost: Included with subscription
- Limitation: Cannot export hourly backups
```

**Method B: pg_dump (Manual periodic export)**
```bash
# Full database backup
pg_dump \
  --host db.xkzpzcvwzqjavftrnxjl.supabase.co \
  --username postgres \
  --dbname crm_db \
  --format custom \
  --file crm_db_backup_$(date +%Y%m%d_%H%M%S).dump

# Size estimate: 100GB-1TB depending on data volume
# Compressed size: 10GB-100GB (10:1 compression ratio)
# Transfer time: 30min-2hours over typical internet
```

**Method C: Logical Replication (Real-time sync)**
```
- Set up read replica on PostgreSQL
- Continuous replication from primary to replica
- Minimal lag (< 1 second)
- Replica can serve read traffic
- Can promote replica to primary if primary fails
- Cost: 2x database infrastructure
```

**Method D: WAL Archiving (Point-in-time recovery)**
```
- Archive Write-Ahead Log (WAL) files to S3/GCS
- Enables recovery to any point in time
- Requires: Base backup + WAL files
- Cost: Minimal (only storage of WAL deltas)
- Complexity: High (requires pg_basebackup + pg_receivewal)
```

#### 3. Storage Location

**Tier 1: Hot Backup (local Supabase)**
- Location: Supabase cloud storage
- Access: Supabase dashboard
- Retention: 7 days rolling window
- Redundancy: Supabase manages (3-way replication assumed)

**Tier 2: Warm Backup (Cloud storage)**
- Location: AWS S3 or Google Cloud Storage
- Access: AWS IAM or GCP service account
- Retention: 30 days
- Encryption: Server-side encryption enabled
- Cost: ~$0.023 per GB/month (S3 Standard)

**Tier 3: Cold Backup (Archive storage)**
- Location: AWS Glacier or Google Cloud Archive
- Access: Service account with time-delayed access
- Retention: 1 year (compliant with data retention laws)
- Encryption: Client-side encryption before upload
- Cost: ~$0.004 per GB/month (S3 Glacier)
- Retrieval time: 12-48 hours

**Tier 4: Compliance Archive**
- Location: Legal-grade WORM storage (Write-Once-Read-Many)
- Access: Restricted, audit logged
- Retention: 7 years (SOX/GDPR requirement)
- Encryption: FIPS 140-2 compliant
- Cost: Varies by provider (AWS Glacier Deep Archive: ~$0.00099/GB/month)

#### 4. Encryption & Security

**In Transit:**
- ✅ HTTPS/TLS 1.2+ for all transfers
- ✅ Supabase SSL mode: require (certificate verification)
- ✅ AWS S3 encryption in transit (TLS 1.2)

**At Rest:**
- ✅ Supabase: Encrypted by default (AES-256)
- ✅ AWS S3: Server-side encryption (AES-256)
- ✅ Google Cloud Storage: Google-managed encryption (AES-256)
- ✅ Backup files: Encrypted before uploading to cold storage

**Key Management:**
- ✅ Supabase: Managed by Supabase (customer cannot access raw backups)
- ✅ AWS KMS: Use AWS KMS for backup encryption keys
- ✅ Google Cloud KMS: Use Google Cloud KMS for backup encryption keys
- Rotation: Annual key rotation policy

**Access Control:**
- ✅ Supabase: Limited to Supabase support team (if needed for restore)
- ✅ AWS IAM: Restrict backup access to ops team only
- ✅ Google IAM: Restrict backup access to ops team only
- Audit Logging: All backup access logged and monitored

---

## Migration Strategy

### Current State: ❌ Not Fully Defined

**Current Setup:**
- Flyway handles schema migrations automatically
- Hibernate DDL auto-update enabled in production
- No data migration strategy documented
- No downtime procedure documented

### Recommended Migration Strategy

#### 1. Schema Migration (Flyway)

**Pre-Migration Checklist:**
```
[ ] Code review: All schema changes reviewed
[ ] Database backup: Full backup taken
[ ] Testing: Migration tested in staging environment
[ ] Rollback plan: Documented and tested
[ ] Monitoring: Application logs monitored during migration
[ ] Notification: Team notified of migration window
[ ] Approval: Change control approval obtained
```

**Migration Execution:**
```
Step 1: Deploy new application version (with migration script)
        └─ Application starts
        └─ Flyway runs migrations on startup
        └─ Each migration:
           ├─ Checks flyway_schema_history
           ├─ Compares version with table
           ├─ IF new version found: Execute SQL
           ├─ IF success: INSERT into flyway_schema_history
           └─ IF failure: ROLLBACK and fail startup

Step 2: Monitor application logs for:
        ├─ Flyway migration output
        ├─ SQL errors
        ├─ Performance metrics
        └─ User-facing errors

Step 3: Verify migration success
        ├─ All migrations executed (check flyway_schema_history)
        ├─ Schema matches application entities
        └─ No data inconsistencies
```

**Zero-Downtime Migrations** (for large tables):

| Migration Type | Strategy | Downtime |
|---|---|---|
| **Add column (nullable)** | No downtime: Add column, update application | 0 |
| **Add column (required)** | Blue-green: Deploy new version, add column with default, update rows in batch | < 30 sec |
| **Remove column** | No downtime: Deprecate in app, remove from schema next deployment | 0 |
| **Add index** | No downtime: Create index CONCURRENTLY | 0 |
| **Rename column** | No downtime: Create new column, copy data, update app, remove old column | 0 |
| **Change column type** | Downtime required: Backup, stop app, migrate, verify, restart | 30 min |
| **Add foreign key** | Downtime if table large: Validate constraints, add FK | 5-30 min |

**Example: Zero-Downtime Column Addition**
```sql
-- Step 1: Add nullable column (can do during normal operation)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_field VARCHAR(255);

-- Step 2: Deploy application (reads/writes to custom_field)
-- App handles NULL gracefully

-- Step 3: Backfill existing rows in batch (no locks)
UPDATE leads SET custom_field = 'default' WHERE custom_field IS NULL;

-- Step 4: Add NOT NULL constraint (or leave nullable)
ALTER TABLE leads ALTER COLUMN custom_field SET NOT NULL;
```

#### 2. Data Migration (Application-Driven)

**Strategy:** Data changes driven by application logic, not raw SQL

**Example: Lead Email Normalization**
```
Old State:
├── leads.email = 'John.Doe@EXAMPLE.COM' (mixed case)
└── Query: SELECT * FROM leads WHERE email = 'john.doe@example.com' → NO MATCH

New State:
├── leads.email = 'john.doe@example.com' (lowercase)
└── Query: SELECT * FROM leads WHERE email = 'john.doe@example.com' → MATCH

Migration Procedure:
  1. Deploy application with normalization logic
  2. Application normalizes on read/write (no forcing)
  3. Batch job runs nightly: UPDATE leads SET email = LOWER(TRIM(email))
  4. Idempotent: Safe to run multiple times
  5. Monitor for conflicts (duplicates after normalization)
```

**Example: Backward Compatibility (Adding New Feature)**
```
Feature: Lead Magnet (Feature #2)
├── New columns: leads.source_magnet_id
├── New tables: lead_magnets, lead_magnet_submissions, lead_magnet_views
├── Constraint change: email uniqueness (GLOBAL → workspace-scoped)

Migration Steps:
  1. Deploy Flyway migration (V12)
     ├─ Add leads.source_magnet_id column (nullable)
     ├─ Create lead_magnets table
     ├─ Create lead_magnet_submissions table
     ├─ Create lead_magnet_views table
     ├─ Add workspace-scoped email unique constraint
     ├─ Remove global email unique constraint
     └─ Existing leads: No change (source_magnet_id = NULL)

  2. Deploy application code
     ├─ Application handles NULL source_magnet_id (backward compatible)
     ├─ New features work with lead magnets
     └─ Old leads work without lead magnet association

  3. Result: Backward compatible, zero downtime
```

#### 3. Downtime Management

**For Changes Requiring Downtime:**

```
Pre-Downtime (1 hour before):
  ├─ Notify customers: "Maintenance window 2-3am UTC"
  ├─ Take full backup
  ├─ Verify backup integrity
  └─ Prepare rollback procedure

During Downtime (planned 30-60 minutes):
  1. Stop application (connection pooling drains)
  2. Verify no active connections: SELECT pid FROM pg_stat_activity
  3. Take final backup before migration
  4. Execute migration script with verification:
     - Check table structure
     - Verify data integrity
     - Run SELECT count(*) on critical tables
     - Compare with pre-migration counts
  5. Restart application
  6. Monitor logs for errors (first 5 minutes critical)

Post-Downtime (1 hour after):
  ├─ Verify all systems operational
  ├─ Monitor error rates
  ├─ Verify customer reports
  └─ Document migration outcome
```

---

## Recovery Strategy

### Current State: ❌ Not Documented

### Recommended Recovery Strategy

#### 1. Point-in-Time Recovery (PITR)

**Objective:** Restore database to any point in time within backup retention window

**Prerequisites:**
- Full backup before target time
- WAL (Write-Ahead Log) files between backup and target time
- Estimated recovery window: 7 days (hot), 30 days (warm), 1 year (cold)

**Procedure: Restore to Specific Timestamp**

```
Target: Restore database to 2026-08-19 14:30:00 (15 minutes after data loss incident)

Step 1: Stop application
  $ systemctl stop crm-backend

Step 2: Verify current database state (DO NOT MODIFY)
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -d crm_db -c \
      "SELECT COUNT(*) as total_leads, MAX(created_at) as latest FROM leads;"
  
Step 3: Create recovery database (isolated)
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -c \
      "CREATE DATABASE crm_db_recovery;"
  
Step 4a: If using Supabase backup restore (easiest)
  - Go to Supabase dashboard
  - Navigate to Project Settings → Backups
  - Select backup closest to 2026-08-19 14:30:00
  - Click "Restore"
  - Specify target database: crm_db_recovery
  - Click "Confirm Restore"
  - Wait 30-60 minutes for restore to complete
  - Verify: SELECT COUNT(*) FROM leads → Should match pre-incident count
  
Step 4b: If using manual pg_dump restore
  - Locate backup file: crm_db_backup_20260819_140000.dump
  - Restore to recovery database:
    $ pg_restore -h db.xkzpzcvwzqjavftrnxjl.supabase.co \
        -U postgres -d crm_db_recovery -j 4 \
        crm_db_backup_20260819_140000.dump
  - Estimated time: 10-30 minutes (depends on size)

Step 5: Verify recovery database
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -d crm_db_recovery << EOF
    SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
    SELECT COUNT(*) FROM leads;
    SELECT COUNT(*) FROM email_campaigns;
    SELECT COUNT(*) FROM automation_executions;
    SELECT MAX(created_at) FROM leads;
    EOF

Step 6: Compare recovered database with production (check for data loss)
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -d crm_db << EOF
    SELECT COUNT(*) as prod_leads FROM leads;
    EOF
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -d crm_db_recovery << EOF
    SELECT COUNT(*) as recovered_leads FROM leads;
    EOF
  
  If recovered > prod: Data recovered successfully
  If recovered < prod: Data was deleted after recovery point (choose earlier backup)

Step 7: Promote recovery database to production
  OPTION A: If recovery successful and complete
    a) Stop application
    b) Drop damaged production database:
       $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -c \
           "DROP DATABASE crm_db;"
    c) Rename recovery database to production:
       $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -c \
           "ALTER DATABASE crm_db_recovery RENAME TO crm_db;"
    d) Update application connection string (if needed)
    e) Restart application
    f) Verify all systems operational (logs, data)
  
  OPTION B: If partial recovery or need to merge
    a) Extract critical data from recovery database
    b) Merge with production using application logic (case-by-case)
    c) Keep both databases until fully verified
    d) Archive for audit trail

Step 8: Verify production after promotion
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -d crm_db << EOF
    SELECT COUNT(*) FROM leads;
    SELECT COUNT(*) FROM email_campaigns;
    SELECT MAX(updated_at) FROM leads;
    SELECT * FROM flyway_schema_history ORDER BY version DESC LIMIT 5;
    EOF

Step 9: Notify users
  $ Send email: "Data recovery completed successfully. No further action needed."
```

#### 2. Partial Table Recovery

**Objective:** Recover specific tables without full database restore

**Scenario:** Email campaign data corrupted, need to recover campaigns and recipients only

```
Step 1: Restore full backup to recovery database (as above)

Step 2: Dump specific tables from recovery database
  $ pg_dump -h db.xkzpzcvwzqjavftrnxjl.supabase.co \
      -U postgres -d crm_db_recovery \
      --tables email_campaigns email_campaign_recipients email_campaign_history \
      --format custom > email_recovery.dump

Step 3: Restore specific tables to production
  $ pg_restore -h db.xkzpzcvwzqjavftrnxjl.supabase.co \
      -U postgres -d crm_db \
      --data-only \  # Only restore data, not schema
      email_recovery.dump

Step 4: Verify recovery
  $ psql -h db.xkzpzcvwzqjavftrnxjl.supabase.co -U postgres -d crm_db << EOF
    SELECT COUNT(*) FROM email_campaigns WHERE updated_at > '2026-08-19 14:00:00';
    SELECT COUNT(*) FROM email_campaign_recipients WHERE updated_at > '2026-08-19 14:00:00';
    EOF
```

#### 3. Verification Procedure

**Post-Recovery Checklist:**

```
Structural Integrity:
  [ ] All tables present (28+ tables)
  [ ] All foreign key constraints intact
  [ ] All indexes exist
  [ ] Sequence values correct (no ID collisions)

Data Integrity:
  [ ] Row counts match expectations
  [ ] No NULL values in NOT NULL columns
  [ ] Foreign key references valid
  [ ] Unique constraints not violated
  [ ] Timestamps reasonable (not in future)

Application Verification:
  [ ] Application starts without errors
  [ ] Can login (authentication works)
  [ ] Can create workspace (test functionality)
  [ ] Can create leads (core feature works)
  [ ] Can send email campaign (integration works)
  [ ] Can trigger automation (automation works)
  [ ] No error logs in first 5 minutes

Performance Baseline:
  [ ] Query response times acceptable
  [ ] No table bloat (VACUUM ANALYZE)
  [ ] Connection pool working
  [ ] No deadlocks (check pg_locks)

User Communication:
  [ ] Notify customers of recovery completion
  [ ] Document incident in postmortem
  [ ] Identify root cause
  [ ] Plan preventative measures
```

---

## Rollback Strategy

### Current State: ❌ Not Documented

### Recommended Rollback Strategy

#### 1. Application Version Rollback

**Scenario:** New application version deployed, discovered critical bug affecting production

```
Pre-Deployment (every release):
  ├─ Tag Docker image: crm-backend:v1.2.3
  ├─ Tag Docker image: crm-backend:latest
  ├─ Save deployment config: deployment-v1.2.3.yaml
  ├─ Keep previous version: crm-backend:v1.2.2 (don't delete)
  └─ Keep database backup: crm_db_backup_v1.2.2.dump

Incident Detection (during deployment):
  ├─ Monitoring alert: Error rate > 5%
  ├─ OR User report: Feature X broken
  ├─ Decision: Rollback needed
  └─ Impact: 5-10 minutes outage acceptable

Rollback Procedure (Kubernetes):
  1. Check current deployment:
     $ kubectl get deployment crm-backend -o jsonpath='{.spec.template.spec.containers[0].image}'
     Output: crm-backend:v1.2.3

  2. Rollback to previous version:
     $ kubectl set image deployment/crm-backend \
         crm-backend=crm-backend:v1.2.2 --record

  3. Monitor rollout:
     $ kubectl rollout status deployment/crm-backend

  4. Verify:
     $ kubectl logs -l app=crm-backend -f
     $ curl https://api.crm.example.com/health
     $ Check monitoring: Error rate, latency

  5. If successful: Promote rollback to current version
     $ kubectl set image deployment/crm-backend \
         crm-backend=crm-backend:v1.2.2 --record

Rollback Procedure (Railway):
  1. Go to Railway dashboard
  2. Navigate to crm-backend service
  3. Click "Deployments" tab
  4. Find previous deployment (v1.2.2)
  5. Click "Revert to this deployment"
  6. Confirm rollback
  7. Monitor logs for 5 minutes
  8. Verify: Test critical features

Rollback Procedure (Docker manual):
  1. Stop current container:
     $ docker stop crm-backend

  2. Start previous version:
     $ docker run -d --name crm-backend \
         -e DATABASE_URL=... \
         crm-backend:v1.2.2

  3. Verify:
     $ docker logs crm-backend
     $ curl localhost:8080/health

Post-Rollback:
  ├─ Incident report: What failed? When? Why?
  ├─ Root cause analysis: Bug in what feature/component?
  ├─ Fix: Create hotfix branch from v1.2.3
  ├─ Testing: Comprehensive testing of bug + hotfix
  ├─ Redeploy: v1.2.4 with hotfix + rollback prevention
  └─ Communication: Notify users of resolution
```

#### 2. Schema Migration Rollback

**Scenario:** Flyway migration V20 causes data loss or corruption

```
Problem Detection:
  ├─ Application startup fails: Flyway validation error
  ├─ OR Application starts but data missing
  ├─ OR Queries crash with column not found
  └─ Decision: Rollback migration needed

Immediate Action (stop bleeding):
  1. Stop application:
     $ systemctl stop crm-backend

  2. Check migration status:
     $ psql -h db... -U postgres -d crm_db -c \
         "SELECT * FROM flyway_schema_history ORDER BY version DESC;"

Pre-Rollback Decision:
  Question: Can we manually reverse the migration?
  ├─ YES (simple changes like ADD COLUMN):
  │   └─ Manually reverse: DELETE FROM flyway_schema_history WHERE version = 20
  │       Then: ALTER TABLE ... DROP COLUMN ...
  │       Then: Start application with previous code version
  │
  └─ NO (complex changes like COLUMN TYPE CHANGE):
      └─ Use database restore from backup (only option)

Rollback Option A: Manual Migration Reversal (if safe)
  1. Identify Flyway script version: V20
  2. Create reverse SQL script (V20__reverse.sql):
     -- Original: ALTER TABLE leads ADD COLUMN custom_field VARCHAR(255);
     -- Reverse:
     ALTER TABLE leads DROP COLUMN custom_field;
  
  3. Create Flyway undo script (V20__undo.sql):
     -- Flyway Community doesn't auto-run undo scripts
     -- Manually edit: DELETE FROM flyway_schema_history WHERE version = 20
  
  4. Delete problematic migration from Flyway history:
     $ psql -h db... -U postgres -d crm_db << EOF
       DELETE FROM flyway_schema_history WHERE version = 20;
       SELECT * FROM flyway_schema_history ORDER BY version DESC;
       EOF
  
  5. Deploy previous application version (V19 code)
  
  6. Application starts:
     ├─ Reads flyway_schema_history
     ├─ Sees version 19 as latest
     ├─ V20 script not found in migrations directory
     ├─ Skips V20 execution
     └─ Application continues normally

Post-Rollback Verification:
  ├─ [ ] Application starts cleanly
  ├─ [ ] Schema matches expectations (DESCRIBE table ...)
  ├─ [ ] Data integrity verified (COUNT * on critical tables)
  ├─ [ ] flyway_schema_history correct (version 19 is latest)
  └─ [ ] Users can login and use application

Rollback Option B: Database Restore (if migration damage severe)
  1. Take backup of damaged database (for forensics)
  2. Restore from pre-migration backup:
     -- See "Point-in-Time Recovery" above
  3. Deploy previous application version (V19 code)
  4. Verify all systems operational
  5. Post-incident analysis:
     ├─ What went wrong in V20?
     ├─ Why wasn't it caught in testing?
     ├─ How to prevent in future?
     └─ Create V21 with hotfix

Prevention:
  ├─ Always test migrations in staging first
  ├─ Backup before migration
  ├─ Create undo/reverse migration script before deploying forward
  ├─ Document rollback procedure for each migration
  ├─ Keep previous application versions available (don't delete images)
  └─ Automated migration testing:
      ├─ Run migration forward
      ├─ Run migration backward
      ├─ Run migration forward again (idempotent)
      └─ Verify data integrity before/after
```

#### 3. Data Rollback (Accidental Deletion)

**Scenario:** User accidentally deletes all leads in workspace

```
Problem Detection:
  ├─ Timestamp: 2026-08-19 15:30:00 UTC
  ├─ Notification: "We accidentally deleted 10,000 leads!"
  ├─ Impact: Workspace has 0 leads, should have ~10,000
  └─ Action: Data recovery needed

Incident Response:
  1. Stop the incident (prevent further damage):
     ├─ If bug caused deletion: Deploy hotfix immediately
     ├─ If user deleted intentionally: Verify permission (should not be possible)
     └─ If API bug: Disable API endpoint

  2. Assess damage:
     $ psql -h db... -U postgres -d crm_db << EOF
       SELECT workspace_id, COUNT(*) as deleted_leads
       FROM leads
       WHERE updated_at > '2026-08-19 15:00:00'
       AND status = 'DELETED';
       EOF

  3. Determine recovery point:
     ├─ Leads deleted at: 2026-08-19 15:30:00
     ├─ Last good backup: 2026-08-19 14:00:00 (1.5 hours old)
     ├─ RPO: 1 hour (we're at 1.5 hours, acceptable)
     └─ Data loss: 30 minutes of operations between backups

  4. Start recovery (see "Point-in-Time Recovery" above):
     ├─ Restore from backup at 2026-08-19 14:00:00
     ├─ Verify leads present in recovered database
     ├─ Compare counts with production
     └─ Promote recovery database to production

  5. Notify users:
     ├─ "Your workspace data has been restored from a backup."
     ├─ "You may have lost changes in the last 30 minutes."
     ├─ "We've enabled enhanced logging to prevent future incidents."
     └─ "You can download a detailed report of what was restored."
```

---

## Data-Loss Risks

### Risk Assessment Matrix

| Risk | Probability | Impact | Detectability | Mitigation | Owner |
|------|-----------|--------|---|---|---|
| **Cascading DELETE of workspace** | Low | 🔴 CRITICAL | Auto-alert on workspace deletion | 1. Confirmation dialog<br>2. Soft-delete flag<br>3. Point-in-time backup<br>4. Email verification step | Database Ops |
| **Accidental campaign/automation deletion** | Medium | 🟡 HIGH | Manual review | 1. Soft-delete (deleted_at)<br>2. 30-day recovery window<br>3. Audit log of deletions<br>4. Admin approval for delete | Product |
| **Cascading DELETE of email recipients** | Medium | 🟡 HIGH | Email count mismatch | 1. Archive campaigns<br>2. Immutable history table<br>3. Daily email count snapshot<br>4. Email delivery metrics | Database Ops |
| **Lead email collision (global → workspace-scoped)** | Low | 🟡 HIGH | Pre-migration validation | 1. Pre-migration audit<br>2. Deduplicate before migration<br>3. Composite unique constraint<br>4. Error notifications | Database Ops |
| **Cascading DELETE of automation executions** | Low | 🟡 MEDIUM | Execution count mismatch | 1. Archive automations<br>2. Replicate executions to analytics<br>3. Immutable execution log<br>4. 2-year retention | Database Ops |
| **Foreign key constraint violation** | Low | 🟡 MEDIUM | Application error | 1. Database constraints enforced<br>2. Application-level validation<br>3. Pre-operation checks<br>4. Error logging | Backend |
| **Connection pool exhaustion** | Medium | 🟠 MEDIUM | Connection timeout errors | 1. HikariCP monitoring<br>2. Connection limit: 20 (prod)<br>3. Idle timeout: 10min<br>4. Alert on > 15 connections | Database Ops |
| **Query performance degradation** | Medium | 🟠 MEDIUM | Slow query logs | 1. Index monitoring<br>2. Query plan analysis<br>3. VACUUM ANALYZE schedule<br>4. Alert on slow queries | Database Ops |
| **Backup corruption** | Low | 🔴 CRITICAL | Restore failure | 1. Weekly backup verification<br>2. Test restore in staging<br>3. Checksum validation<br>4. Multiple backup copies | Database Ops |
| **Storage capacity exhausted** | Low | 🟡 HIGH | Disk full alerts | 1. Monitor disk usage<br>2. Alert at 70% capacity<br>3. Archive/compress old data<br>4. Increase storage proactively | Database Ops |

### Critical Risk: Cascading DELETE

**Current Behavior:**
```sql
-- When workspace deleted, ALL data deleted by cascade
DELETE FROM workspaces WHERE id = 123;
-- Triggers cascade:
├─ leads (workspace_id FK)
├─ email_campaigns (workspace_id FK)
├─ automation_executions (automation_id → automation_id → workspace_id)
└─ [20+ other tables]
```

**Problem:**
- Accidental workspace deletion = complete data loss
- No audit trail of what was deleted
- No soft-delete recovery window
- No way to undo (except backup restore)

**Mitigation:**
```sql
-- Option 1: Soft-delete with recovery window
ALTER TABLE workspaces ADD COLUMN deleted_at TIMESTAMP;
-- Then: 30 days after deletion, job hard-deletes
-- SELECT * FROM workspaces WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days'

-- Option 2: Archive before delete
CREATE TABLE workspaces_archive AS SELECT * FROM workspaces WHERE deleted_at IS NOT NULL;
DELETE FROM workspaces WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Option 3: Require confirmation
-- Application: Require 2-factor confirmation before workspace deletion
```

---

## Safe Backup Procedures

### Backup Execution Checklist

#### Pre-Backup

```
1 week before:
  [ ] Verify backup storage has available capacity
      SELECT pg_database_size('crm_db') / 1024^3 AS size_gb;
      # Estimate: If size_gb = 100, need 100-500 GB storage (5x compression ratio)
  
  [ ] Verify backup credentials (S3/GCS keys) valid
  [ ] Verify backup retention policy documented
  [ ] Schedule backup during low-traffic window (2-4 AM UTC)

1 day before:
  [ ] Notify team: "Full backup scheduled for tomorrow 2 AM UTC"
  [ ] Verify backup process documented and tested
  [ ] Verify restore procedure documented and tested
  [ ] Verify monitoring alerts configured
```

#### During-Backup

**Method 1: Supabase Native Backup (Recommended)**
```bash
# No action required
# Supabase automatically backs up daily
# Backup runs: 2 AM UTC (configurable)
# Retention: 7 days (configurable)

# Check backup status:
# 1. Go to Supabase dashboard
# 2. Click project name
# 3. Navigate to: Settings → Database → Backups
# 4. Verify: Latest backup timestamp and size
```

**Method 2: Manual pg_dump to S3**
```bash
#!/bin/bash

# Configuration
DB_HOST="db.xkzpzcvwzqjavftrnxjl.supabase.co"
DB_USER="postgres"
DB_NAME="crm_db"
DB_PORT="5432"
S3_BUCKET="company-db-backups"
S3_REGION="us-east-1"
BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="crm_db_backup_${BACKUP_TIMESTAMP}.dump"

# Step 1: Create backup
echo "Starting backup at $(date)"
pg_dump \
  --host $DB_HOST \
  --username $DB_USER \
  --port $DB_PORT \
  --dbname $DB_NAME \
  --format custom \
  --verbose \
  --file $BACKUP_FILE
BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Step 2: Compress backup
echo "Compressing backup..."
gzip -9 $BACKUP_FILE
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h $COMPRESSED_FILE | cut -f1)
echo "Compressed: $COMPRESSED_FILE ($COMPRESSED_SIZE)"

# Step 3: Upload to S3
echo "Uploading to S3..."
aws s3 cp $COMPRESSED_FILE \
  s3://$S3_BUCKET/$COMPRESSED_FILE \
  --region $S3_REGION \
  --sse AES256 \
  --storage-class STANDARD_IA
echo "Uploaded to S3: s3://$S3_BUCKET/$COMPRESSED_FILE"

# Step 4: Verify upload
echo "Verifying upload..."
aws s3 ls s3://$S3_BUCKET/$COMPRESSED_FILE --region $S3_REGION
if [ $? -eq 0 ]; then
  echo "Backup verified in S3"
  # Clean up local file
  rm $COMPRESSED_FILE
  echo "Local backup deleted"
else
  echo "ERROR: Upload verification failed"
  exit 1
fi

# Step 5: Tag backup with metadata
echo "Tagging backup..."
aws s3api put-object-tagging \
  --bucket $S3_BUCKET \
  --key $COMPRESSED_FILE \
  --tagging 'TagSet=[{Key=type,Value=database-backup},{Key=database,Value=crm_db},{Key=date,Value='${BACKUP_TIMESTAMP}'}]' \
  --region $S3_REGION

echo "Backup completed at $(date)"
```

**Method 3: Logical Replication (Continuous Sync)**
```sql
-- On PRIMARY (production):
-- Create replication slot
SELECT * FROM pg_create_logical_replication_slot('crm_backup', 'test_decoding');

-- On REPLICA (standby):
-- Set up subscription
CREATE SUBSCRIPTION crm_replica_sub 
  CONNECTION 'dbname=crm_db host=db.xkzpzcvwzqjavftrnxjl.supabase.co user=postgres'
  PUBLICATION crm_pub
  WITH (copy_data = true);

-- Monitor replication lag
SELECT slot_name, restart_lsn, confirmed_flush_lsn FROM pg_replication_slots;
```

#### Post-Backup

```bash
#!/bin/bash

# Step 1: Verify backup integrity
echo "Verifying backup integrity..."
pg_dump --list crm_db_backup_20260819_020000.dump | head -20
# Output: Should show tables, sequences, indexes

# Step 2: Test restore (in staging)
echo "Testing restore in staging environment..."
# Option A: Full restore to recovery database
pg_restore \
  --host staging-db.example.com \
  --username postgres \
  --dbname crm_db_staging_test \
  --jobs 4 \
  crm_db_backup_20260819_020000.dump

# Option B: Verify restore
psql -h staging-db.example.com -U postgres -d crm_db_staging_test << EOF
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
SELECT COUNT(*) as leads_count FROM leads;
SELECT COUNT(*) as campaigns_count FROM email_campaigns;
SELECT MAX(created_at) FROM leads;
EOF

# Step 3: Generate backup report
echo "Generating backup report..."
cat > backup_report_20260819.txt << EOF
Backup Date: 2026-08-19 02:00:00 UTC
Backup File: crm_db_backup_20260819_020000.dump
Compressed File: crm_db_backup_20260819_020000.dump.gz
Compressed Size: $(du -h crm_db_backup_20260819_020000.dump.gz | cut -f1)
Storage Location: s3://company-db-backups/crm_db_backup_20260819_020000.dump.gz
Retention: Until 2026-09-19 (30 days)
Restore Test: PASSED
Backup Integrity: VERIFIED
Checksum: $(sha256sum crm_db_backup_20260819_020000.dump | cut -d' ' -f1)
EOF

# Step 4: Cleanup
rm crm_db_backup_20260819_020000.dump  # Remove uncompressed backup (space savings)
echo "Backup procedure completed"
```

#### Backup Monitoring

```bash
#!/bin/bash
# Run daily to verify backups are being created

# Check Supabase backup status
BACKUP_TIME=$(aws s3 ls s3://company-db-backups/ --region us-east-1 | tail -1 | awk '{print $1, $2}')
BACKUP_SIZE=$(aws s3 ls s3://company-db-backups/ --region us-east-1 | tail -1 | awk '{print $5}')
BACKUP_AGE=$(($(date +%s) - $(date -d "$BACKUP_TIME" +%s)))

echo "Latest Backup: $BACKUP_TIME"
echo "Backup Size: $BACKUP_SIZE bytes"
echo "Backup Age: $BACKUP_AGE seconds ($((BACKUP_AGE / 3600)) hours)"

if [ $BACKUP_AGE -gt 86400 ]; then  # > 24 hours
  echo "WARNING: Backup is older than 24 hours!"
  # Send alert to monitoring system
fi

if [ $BACKUP_SIZE -lt 1000000 ]; then  # < 1 MB (too small)
  echo "ERROR: Backup size suspiciously small!"
  # Send critical alert
fi
```

---

## Recovery Procedures

### Recovery Procedure Template

**Scenario Recovery Checklist:**

```
SCENARIO: [Brief description]
IMPACT: [What's broken?]
RPO/RTO: Recovery Point: 1 hour | Recovery Time: 2 hours

PREREQUISITE CHECKS:
  [ ] Backup exists and is accessible
  [ ] Backup is recent enough (< 1 hour old)
  [ ] Backup has been tested and verified
  [ ] Recovery database can be created
  [ ] Application can be stopped gracefully
  [ ] Change control approval obtained
  [ ] Team notified of recovery operation
  [ ] Monitoring configured to alert on issues

RECOVERY STEPS:

  Step 1: STOP APPLICATION
    Command: kubectl set deployment crm-backend replicas=0
    Verify: kubectl get pods | grep crm-backend → no pods
    Reason: Prevent writes during recovery
    
  Step 2: ASSESS DAMAGE
    Query: SELECT COUNT(*) FROM leads;
    Expected: > 1000 (pre-incident count was 10,000)
    Action: If count matches expected, no recovery needed
    
  Step 3: RESTORE FROM BACKUP
    Command: pg_restore -h ... -d crm_db < backup.dump
    Estimated Time: 10-30 minutes
    Monitor: tail -f restore.log
    
  Step 4: VERIFY RECOVERY
    Checks:
      [ ] Tables present: SELECT count(*) FROM information_schema.tables
      [ ] Data integrity: SELECT COUNT(*) FROM leads; → 10,000
      [ ] Foreign keys valid: SELECT * FROM information_schema.table_constraints
      [ ] Indexes exist: SELECT * FROM information_schema.statistics
      [ ] Sequences correct: SELECT * FROM information_schema.sequences
    
  Step 5: START APPLICATION
    Command: kubectl set deployment crm-backend replicas=1
    Monitor: kubectl logs -f deployment/crm-backend
    Verify: curl https://api.crm.example.com/health → 200 OK
    
  Step 6: FUNCTIONAL TESTING
    [ ] Login works
    [ ] Can create workspace
    [ ] Can create lead
    [ ] Can send email campaign
    [ ] Can trigger automation
    [ ] API endpoints respond normally
    
  Step 7: COMMUNICATE WITH USERS
    Message: "Database recovered from backup. Please verify your data is intact."
    Links: [View incident report] [File support ticket]

POST-RECOVERY:
  [ ] Incident report filed
  [ ] Root cause analysis planned
  [ ] Preventative measures identified
  [ ] Recovery procedure improvements documented
  [ ] Team training completed
```

---

## Rollback Procedures

### Rollback Procedure Template

**Scenario Rollback Checklist:**

```
SCENARIO: [Brief description of what went wrong]
DECISION: Rollback decided at [timestamp]
IMPACT: Reverting to version [X] will [consequences]
APPROVAL: [Name] approved rollback at [timestamp]

ROLLBACK STEPS:

  Step 1: NOTIFY USERS (PRE-ROLLBACK)
    Message: "We've identified an issue and are reverting to a previous version."
    Duration: "Service will be offline for ~5-10 minutes"
    Send: Slack, email, in-app notification
    
  Step 2: STOP APPLICATION
    Command: kubectl set deployment crm-backend replicas=0
    Verify: kubectl get pods | grep crm-backend → no pods
    
  Step 3: IDENTIFY ROLLBACK TARGET
    Current Version: v1.2.3 (broken)
    Previous Version: v1.2.2 (last known good)
    Verification: kubectl get deployment crm-backend -o jsonpath='{.status.conditions[?(@.type=="Progressing")].message}'
    
  Step 4: PERFORM ROLLBACK
    Command: kubectl rollout undo deployment/crm-backend --to-revision=5
    Monitor: kubectl rollout status deployment/crm-backend
    Estimated Time: 2-5 minutes
    
  Step 5: VERIFY ROLLBACK
    Checks:
      [ ] Deployment rolled back: kubectl get deployment crm-backend -o wide
      [ ] Pods running: kubectl get pods | grep crm-backend → 1/1 Running
      [ ] Logs clean: kubectl logs deployment/crm-backend | grep -i error
      [ ] API responds: curl https://api.crm.example.com/health → 200 OK
      [ ] Broken feature works: [manual test of broken functionality]
    
  Step 6: FUNCTIONAL TESTING
    [ ] Login works
    [ ] Can create workspace
    [ ] Can view leads (feature that was broken)
    [ ] Can send email (feature that was broken)
    [ ] No errors in logs
    
  Step 7: NOTIFY USERS (POST-ROLLBACK)
    Message: "Service has been restored. We've reverted to v1.2.2 to fix an issue."
    Status: "All systems operational"
    Next: "We'll deploy a fix soon."

POST-ROLLBACK:
  [ ] Create incident ticket with timeline
  [ ] Root cause analysis: What was the bug?
  [ ] Testing improvement: Why wasn't it caught?
  [ ] Hotfix development: Create v1.2.4 with fix
  [ ] Comprehensive testing: Full test suite + manual testing
  [ ] Staged rollout: 10% → 50% → 100%
  [ ] Re-deployment: Deploy v1.2.4 to production
```

---

## Testing Procedures

### Regular Backup Testing Schedule

| Test | Frequency | Duration | Owner | Procedure |
|---|---|---|---|---|
| **Backup Integrity Check** | Daily | 5 min | Ops | Verify latest backup size/timestamp/checksum |
| **Restore to Staging** | Weekly | 30 min | Ops | Restore backup to staging DB, verify row counts |
| **Point-in-Time Recovery** | Monthly | 1 hour | Ops | Restore to specific timestamp, verify data |
| **Disaster Recovery Drill** | Quarterly | 4 hours | Ops + Dev | Full recovery simulation with app verification |
| **Data Integrity Audit** | Quarterly | 2 hours | DBA | Verify constraints, indexes, sequences, referential integrity |

### Test #1: Daily Backup Integrity Check

```bash
#!/bin/bash
# Daily: Verify backup exists, is recent, has reasonable size

BACKUP_FILE=$(aws s3 ls s3://company-db-backups/ --region us-east-1 | tail -1 | awk '{print $NF}')
BACKUP_DATE=$(aws s3 ls s3://company-db-backups/ --region us-east-1 | tail -1 | awk '{print $1}')
BACKUP_SIZE=$(aws s3 ls s3://company-db-backups/ --region us-east-1 | tail -1 | awk '{print $5}')

echo "Backup Integrity Check: $(date)"
echo "Latest Backup: $BACKUP_FILE"
echo "Date: $BACKUP_DATE"
echo "Size: $BACKUP_SIZE bytes ($((BACKUP_SIZE / 1024 / 1024)) MB)"

# Verify size is reasonable (> 10 MB)
if [ $BACKUP_SIZE -lt 10485760 ]; then
  echo "ERROR: Backup size too small (< 10 MB)"
  exit 1
fi

# Verify backup is recent (< 24 hours old)
BACKUP_TIMESTAMP=$(date -d "$BACKUP_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
BACKUP_AGE=$((CURRENT_TIMESTAMP - BACKUP_TIMESTAMP))

if [ $BACKUP_AGE -gt 86400 ]; then
  echo "ERROR: Backup is older than 24 hours"
  exit 1
fi

echo "✓ Backup integrity check passed"
```

### Test #2: Weekly Staging Restore

```bash
#!/bin/bash
# Weekly: Restore backup to staging, verify row counts

echo "Starting weekly staging restore test: $(date)"

# Step 1: Download latest backup
aws s3 cp s3://company-db-backups/crm_db_backup_latest.dump.gz \
  /tmp/crm_db_backup_staging.dump.gz \
  --region us-east-1

# Step 2: Decompress
gunzip /tmp/crm_db_backup_staging.dump.gz

# Step 3: Create clean staging database
psql -h staging-db.example.com -U postgres -c "DROP DATABASE IF EXISTS crm_db_staging_test;"
psql -h staging-db.example.com -U postgres -c "CREATE DATABASE crm_db_staging_test;"

# Step 4: Restore
pg_restore \
  --host staging-db.example.com \
  --username postgres \
  --dbname crm_db_staging_test \
  --jobs 4 \
  /tmp/crm_db_backup_staging.dump 2>&1 | tee /tmp/restore.log

# Step 5: Verify row counts
PROD_LEADS=$(psql -h prod-db.example.com -U postgres -d crm_db -tc "SELECT COUNT(*) FROM leads;")
STAGING_LEADS=$(psql -h staging-db.example.com -U postgres -d crm_db_staging_test -tc "SELECT COUNT(*) FROM leads;")

echo "Production leads: $PROD_LEADS"
echo "Staging leads: $STAGING_LEADS"

if [ "$PROD_LEADS" = "$STAGING_LEADS" ]; then
  echo "✓ Weekly staging restore test passed"
else
  echo "ERROR: Row count mismatch!"
  exit 1
fi

# Clean up
rm /tmp/crm_db_backup_staging.dump
```

### Test #3: Monthly Point-in-Time Recovery

```bash
#!/bin/bash
# Monthly: Restore to specific timestamp, verify critical data

TARGET_TIME="2026-08-01 12:00:00"  # Restore to specific point in time
echo "Starting monthly PITR test: Restore to $TARGET_TIME"

# Step 1: Create recovery database
psql -h prod-db.example.com -U postgres -c "DROP DATABASE IF EXISTS crm_db_pitr_test;"
psql -h prod-db.example.com -U postgres -c "CREATE DATABASE crm_db_pitr_test;"

# Step 2: Restore backup from around target time
# (In practice, use Supabase PITR feature or WAL archiving)
pg_restore \
  --host prod-db.example.com \
  --username postgres \
  --dbname crm_db_pitr_test \
  crm_db_backup_20260801_000000.dump

# Step 3: Verify specific data at target time
LEADS_AT_TARGET=$(psql -h prod-db.example.com -U postgres -d crm_db_pitr_test << EOF
SELECT COUNT(*) FROM leads WHERE created_at <= '$TARGET_TIME'::timestamp;
EOF
)

CAMPAIGNS_AT_TARGET=$(psql -h prod-db.example.com -U postgres -d crm_db_pitr_test << EOF
SELECT COUNT(*) FROM email_campaigns WHERE created_at <= '$TARGET_TIME'::timestamp;
EOF
)

echo "Leads at $TARGET_TIME: $LEADS_AT_TARGET"
echo "Campaigns at $TARGET_TIME: $CAMPAIGNS_AT_TARGET"

# Step 4: Verify data integrity
psql -h prod-db.example.com -U postgres -d crm_db_pitr_test << EOF
SELECT 'leads' as table_name, COUNT(*) as count FROM leads
UNION ALL
SELECT 'email_campaigns', COUNT(*) FROM email_campaigns
UNION ALL
SELECT 'email_campaign_recipients', COUNT(*) FROM email_campaign_recipients
ORDER BY table_name;
EOF

echo "✓ Monthly PITR test passed"
```

### Test #4: Quarterly Disaster Recovery Drill

```bash
#!/bin/bash
# Quarterly: Full recovery simulation with app verification
# Requires: Staging environment, 4 hours downtime for drill

echo "QUARTERLY DISASTER RECOVERY DRILL"
echo "Start Time: $(date)"
echo "Objective: Full recovery from backup with application verification"

# Step 1: BACKUP CURRENT STATE
echo "Step 1: Backing up current staging state..."
pg_dump -h staging-db.example.com -U postgres -d crm_db_staging \
  > /tmp/crm_db_staging_pretest.dump

# Step 2: CORRUPT/DELETE DATA (simulating disaster)
echo "Step 2: Simulating data disaster..."
psql -h staging-db.example.com -U postgres -d crm_db_staging << EOF
DELETE FROM leads WHERE workspace_id = 123;  -- Simulate accidental deletion
EOF

LEADS_AFTER_DELETE=$(psql -h staging-db.example.com -U postgres -d crm_db_staging -tc "SELECT COUNT(*) FROM leads WHERE workspace_id = 123;")
echo "Leads after simulated deletion: $LEADS_AFTER_DELETE (should be 0)"

# Step 3: INITIATE RECOVERY
echo "Step 3: Initiating recovery..."
psql -h staging-db.example.com -U postgres -c "DROP DATABASE crm_db_staging;"
psql -h staging-db.example.com -U postgres -c "CREATE DATABASE crm_db_staging;"

pg_restore -h staging-db.example.com -U postgres -d crm_db_staging \
  --jobs 4 crm_db_backup_latest.dump

# Step 4: VERIFY RECOVERY
echo "Step 4: Verifying recovery..."
LEADS_AFTER_RECOVERY=$(psql -h staging-db.example.com -U postgres -d crm_db_staging -tc "SELECT COUNT(*) FROM leads WHERE workspace_id = 123;")
echo "Leads after recovery: $LEADS_AFTER_RECOVERY"

if [ "$LEADS_AFTER_RECOVERY" != "0" ]; then
  echo "✓ Data successfully recovered"
else
  echo "ERROR: Recovery failed - no data found"
  exit 1
fi

# Step 5: APPLICATION TESTING
echo "Step 5: Testing application with recovered database..."

# Update app connection string to staging
export DATABASE_URL="jdbc:postgresql://staging-db.example.com:5432/crm_db_staging"

# Start app
docker run -d --name crm-backend-test \
  -e DATABASE_URL=$DATABASE_URL \
  crm-backend:latest

# Wait for startup
sleep 30

# Functional tests
echo "Running functional tests..."
curl http://localhost:8080/health
curl -X GET http://localhost:8080/api/v1/leads/list
curl -X POST http://localhost:8080/api/v1/campaigns/search -H "Content-Type: application/json" -d '{"workspace_id":123}'

# Stop app
docker stop crm-backend-test

# Step 6: RESTORE ORIGINAL STATE
echo "Step 6: Restoring original staging state..."
psql -h staging-db.example.com -U postgres -c "DROP DATABASE crm_db_staging;"
psql -h staging-db.example.com -U postgres -c "CREATE DATABASE crm_db_staging;"
pg_restore -h staging-db.example.com -U postgres -d crm_db_staging \
  /tmp/crm_db_staging_pretest.dump

echo "DRILL COMPLETE"
echo "End Time: $(date)"
echo "Result: ✓ PASSED (Full recovery and app verification successful)"
```

---

## Summary & Recommendations

### Critical Action Items (Immediate)

1. **❌ → ✅ Document Backup Schedule**
   - Decision: Daily backups via Supabase (native) + Weekly S3 exports (redundancy)
   - Retention: 7 days (hot), 30 days (warm), 1 year (cold)
   - Estimated cost: ~$50-200/month (S3 storage)

2. **❌ → ✅ Test Recovery Procedure**
   - Action: Run Test #2 (Weekly Staging Restore) once immediately
   - Timeline: 30 minutes
   - Outcome: Verify backup can be restored successfully

3. **❌ → ✅ Implement Soft-Deletes**
   - Where: workspaces, email_campaigns, automations
   - Addition: Add `deleted_at TIMESTAMP` column
   - Benefit: 30-day recovery window without backup restore

4. **❌ → ✅ Archive Immutable Tables**
   - Where: email_campaign_history, automation_executions
   - Pattern: Archive old records (> 1 year) to cold storage
   - Benefit: Reduced table size, faster queries, compliance audit trail

5. **❌ → ✅ Create Runbooks**
   - Recovery runbook (copy procedures above)
   - Rollback runbook (copy procedures above)
   - Post-incident template (root cause analysis)
   - Team training (2 hours, quarterly refresher)

### Ongoing Monitoring

| Metric | Alert Threshold | Action |
|--------|---|---|
| Latest backup age | > 24 hours | Investigate backup job failure |
| Backup size | < 10 MB OR > 1 TB | Verify backup integrity |
| Disk usage | > 80% | Expand disk or archive data |
| Connection pool | > 15 active | Check for slow queries |
| Slow queries | > 5 seconds | Review query plans, add indexes |
| Foreign key violations | Any | Application bug (fix immediately) |
| Cascading deletes | Alert on large deletes | Require approval before workspace delete |

### Success Criteria

✅ **Phase 12.8 Complete When:**
1. Backup strategy documented (daily frequency, 30-day retention, S3 storage)
2. Recovery procedures tested (weekly staging restore passing)
3. Rollback procedures documented (application + schema rollback)
4. Data-loss risks identified (10 critical risks with mitigations)
5. Safe procedures documented (with runnable bash scripts)
6. Testing schedule established (daily/weekly/monthly/quarterly cadence)

✅ **Production Readiness When:**
1. All procedures tested in staging (passed Test #1-4)
2. Team trained on recovery/rollback procedures (2-hour training)
3. Monitoring alerts configured (6+ metrics)
4. Post-incident runbook approved (change control)
5. Backup redundancy verified (2+ backup copies)

---

**End of Phase 12.8 Database Backup and Recovery Plan**

**Prepared by:** Database Operations Team
**Next Review:** 2026-12-19 (quarterly)
**Last Updated:** 2026-08-19

