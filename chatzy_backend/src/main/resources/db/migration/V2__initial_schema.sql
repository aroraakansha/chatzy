-- V2__add_user_fields.sql

-- Add email
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
UPDATE users SET email = 'temp_' || id::text || '@example.com' WHERE email IS NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add password
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
UPDATE users SET password = 'temporary_password' WHERE password IS NULL;
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Add username
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
UPDATE users SET username = 'user_' || id::text WHERE username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);