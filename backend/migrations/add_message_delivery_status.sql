-- Migration: Add delivery status tracking to messages
-- Date: 2025-12-14
-- Description: Adds 'status' and 'terkirim_pada' fields for message delivery tracking

-- Add status column (sent, delivered, read)
ALTER TABLE pesan
ADD COLUMN status ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent'
AFTER lampiran;

-- Add terkirim_pada (delivered_at timestamp)
ALTER TABLE pesan
ADD COLUMN terkirim_pada DATETIME NULL
AFTER dibaca_pada;

-- Update existing messages to have 'delivered' status
UPDATE pesan
SET status = CASE
    WHEN is_read = 1 THEN 'read'
    ELSE 'delivered'
END
WHERE status = 'sent';
