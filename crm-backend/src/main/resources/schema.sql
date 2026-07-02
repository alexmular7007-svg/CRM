-- ─── Task Manager + CRM Database Schema ────────────────────────────────────
-- Run this ONLY if ddl-auto=none; with ddl-auto=update Hibernate creates it automatically

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(255)     NOT NULL,
    description      TEXT,
    status           VARCHAR(20)      NOT NULL DEFAULT 'TODO',
    priority         VARCHAR(10)      NOT NULL DEFAULT 'MEDIUM',
    due_date         DATE,
    assigned_to_id   BIGINT,
    assigned_to_name VARCHAR(100),
    created_by_id    BIGINT           NOT NULL,
    created_by_name  VARCHAR(100),
    project_id       BIGINT,
    project_name     VARCHAR(150),
    attachment_urls  TEXT,
    created_at       TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP        NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMP
);

-- Task Comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id          BIGSERIAL PRIMARY KEY,
    task_id     BIGINT       NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content     TEXT         NOT NULL,
    author_id   BIGINT       NOT NULL,
    author_name VARCHAR(100),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority    ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project     ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by  ON tasks(created_by_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date    ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comments_task     ON task_comments(task_id);

-- Status constraint
ALTER TABLE tasks
    ADD CONSTRAINT chk_task_status
    CHECK (status IN ('TODO','IN_PROGRESS','IN_REVIEW','DONE','CANCELLED'));

-- Priority constraint
ALTER TABLE tasks
    ADD CONSTRAINT chk_task_priority
    CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT'));


-- Add archived column to projects if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);
