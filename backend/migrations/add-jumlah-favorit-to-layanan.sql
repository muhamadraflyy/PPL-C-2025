-- Add jumlah_favorit column to layanan table
ALTER TABLE layanan
ADD COLUMN jumlah_favorit INT UNSIGNED NOT NULL DEFAULT 0
COMMENT 'Total number of favorites (global count across all users)';

-- Create index for better performance on sorting by favorites
CREATE INDEX idx_jumlah_favorit ON layanan(jumlah_favorit);

-- Initialize jumlah_favorit based on existing favorit table data
UPDATE layanan l
SET l.jumlah_favorit = (
  SELECT COUNT(*)
  FROM favorit f
  WHERE f.layanan_id = l.id
  AND f.type = 'favorite'
);
