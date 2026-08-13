-- Rename email column to identifier in otps table
ALTER TABLE otps RENAME COLUMN email TO identifier;

-- Update index names
DROP INDEX IF EXISTS idx_otp_email;
CREATE INDEX idx_otp_identifier ON otps(identifier);
