-- Migration: Add type column to favorit table to separate favorite and bookmark
-- Date: 2025-12-07

-- Step 1: Add type column with default value
ALTER TABLE favorit
ADD COLUMN type ENUM('favorite', 'bookmark') NOT NULL DEFAULT 'favorite'
COMMENT 'Type: favorite (public like) or bookmark (private save)';

-- Step 2: Drop old unique constraint
ALTER TABLE favorit DROP INDEX unique_user_layanan;

-- Step 3: Add new unique constraint with type
ALTER TABLE favorit
ADD CONSTRAINT unique_user_layanan_type UNIQUE (user_id, layanan_id, type);

-- Step 4: Add index on type column for better query performance
ALTER TABLE favorit ADD INDEX idx_type (type);

-- Verification query
SELECT 'Migration completed successfully' AS status;
SELECT COUNT(*) AS total_records FROM favorit;
