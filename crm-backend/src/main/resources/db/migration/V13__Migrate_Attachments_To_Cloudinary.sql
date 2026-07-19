-- Migration V13: Migrate Attachment Storage from Supabase to Cloudinary
-- 
-- Changes:
-- 1. Add Cloudinary-specific columns
-- 2. Make storage_path nullable (for backward compatibility)
-- 3. Add new indexes for Cloudinary public IDs
-- 4. Initialize existing attachments with safe defaults

-- Step 1: Add Cloudinary columns
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(500) UNIQUE,
ADD COLUMN IF NOT EXISTS secure_url VARCHAR(1000),
ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50);

-- Step 2: Make storage_path nullable (was NOT NULL in V9)
-- First, remove the UNIQUE constraint to allow NULLs
ALTER TABLE attachments 
DROP CONSTRAINT IF EXISTS attachments_storage_path_key;

-- Then make the column nullable
ALTER TABLE attachments 
ALTER COLUMN storage_path DROP NOT NULL;

-- Step 3: Add indexes for Cloudinary public ID and secure URL
CREATE INDEX IF NOT EXISTS idx_cloudinary_public_id 
ON attachments (cloudinary_public_id);

-- Step 4: Set defaults for NOT NULL columns that need values
-- For existing rows: initialize cloudinary_public_id from storage_path if present
UPDATE attachments 
SET cloudinary_public_id = storage_path,
    secure_url = COALESCE(secure_url, 'https://placeholder.invalid/'),
    resource_type = COALESCE(resource_type, 'raw')
WHERE cloudinary_public_id IS NULL;

-- Step 5: Now add NOT NULL constraints to new columns
ALTER TABLE attachments 
ALTER COLUMN secure_url SET NOT NULL,
ALTER COLUMN resource_type SET NOT NULL;

-- Document the changes
COMMENT ON COLUMN attachments.cloudinary_public_id IS 'Cloudinary Public ID (replaces storage_path for new uploads)';
COMMENT ON COLUMN attachments.secure_url IS 'Cloudinary Secure HTTPS URL for direct download/preview';
COMMENT ON COLUMN attachments.resource_type IS 'Cloudinary resource type: image, video, raw, etc.';
COMMENT ON COLUMN attachments.storage_path IS 'Legacy field - kept for backward compatibility. Use cloudinary_public_id for new uploads.';
