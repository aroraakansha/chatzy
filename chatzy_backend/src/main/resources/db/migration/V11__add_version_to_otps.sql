-- Add version column for optimistic locking
ALTER TABLE otps ADD COLUMN version BIGINT DEFAULT 0;
