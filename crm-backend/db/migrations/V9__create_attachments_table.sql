-- PHASE 3: Create Attachment Metadata Table
-- Stores file metadata for files stored in Supabase Storage
-- This table keeps track of uploaded attachments with:
-- - Storage path (for Supabase Storage)
-- - Original filename (as uploaded)
-- - MIME type
-- - File size
-- - Uploader information
-- - Association with chat messages or tasks

CREATE TABLE IF NOT EXISTS attachments (
    id BIGSERIAL PRIMARY KEY,
    
    -- Supabase Storage path (e.g., "chat/550e8400-e29b-41d4-a716-446655440000.pdf")
    storage_path VARCHAR(1000) NOT NULL UNIQUE,
    
    -- Original filename as uploaded by user
    original_filename VARCHAR(500) NOT NULL,
    
    -- MIME type (application/pdf, image/png, etc.)
    mime_type VARCHAR(200) NOT NULL,
    
    -- File size in bytes
    file_size BIGINT NOT NULL,
    
    -- SHA-256 hash for integrity verification
    content_hash VARCHAR(64),
    
    -- Who uploaded this file
    uploaded_by BIGINT NOT NULL,
    
    -- Associated chat message (if any)
    chat_message_id BIGINT,
    
    -- Associated task (if any)
    task_id BIGINT,
    
    -- Whether this attachment is public
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Download count for analytics
    download_count INTEGER DEFAULT 0,
    
    -- Last download timestamp
    last_downloaded_at TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete flag
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_attachment_uploader FOREIGN KEY (uploaded_by)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_chat_message FOREIGN KEY (chat_message_id)
        REFERENCES chat_messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_task FOREIGN KEY (task_id)
        REFERENCES tasks(id) ON DELETE CASCADE
);

-- Indexes for common queries
CREATE INDEX idx_storage_path ON attachments (storage_path);
CREATE INDEX idx_uploaded_by ON attachments (uploaded_by);
CREATE INDEX idx_chat_message_id ON attachments (chat_message_id);
CREATE INDEX idx_task_id ON attachments (task_id);
CREATE INDEX idx_created_at ON attachments (created_at);
CREATE INDEX idx_is_deleted_created ON attachments (is_deleted, created_at);

-- Enable row-level security if needed
-- ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE attachments IS 'Metadata for file attachments stored in Supabase Storage';
COMMENT ON COLUMN attachments.storage_path IS 'Supabase Storage path (immutable, unique)';
COMMENT ON COLUMN attachments.content_hash IS 'SHA-256 hash for integrity verification';
COMMENT ON COLUMN attachments.is_public IS 'Public attachments (false=requires permission)';
COMMENT ON COLUMN attachments.is_deleted IS 'Soft delete flag for retention period';
