-- ═══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Automation Phase 1→Phase 2 Compatibility
-- Updates automations table to support both Phase 1 and Phase 2 models
-- 
-- IDEMPOTENT: Safe to run multiple times
-- AUTO-EXECUTED: Flyway will execute this migration automatically
-- 
-- Changes:
-- 1. Make trigger_config nullable (Phase 2 uses steps instead)
-- 2. Make action_config nullable (Phase 2 uses steps instead)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. MAKE trigger_config NULLABLE
-- ───────────────────────────────────────────────────────────────────────────
ALTER TABLE automations
ALTER COLUMN trigger_config DROP NOT NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. ENSURE action_config IS NULLABLE (already is, this is idempotent)
-- ───────────────────────────────────────────────────────────────────────────
-- action_config was already nullable in V17, no change needed
-- This comment serves as documentation

COMMIT;
