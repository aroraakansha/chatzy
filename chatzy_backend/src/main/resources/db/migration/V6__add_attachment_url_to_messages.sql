ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS reply_to_message_id VARCHAR(255);