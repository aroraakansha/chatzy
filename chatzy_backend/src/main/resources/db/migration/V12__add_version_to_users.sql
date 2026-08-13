-- Add version column for optimistic locking
ALTER TABLE users ADD COLUMN version BIGINT DEFAULT 0;
