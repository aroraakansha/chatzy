ALTER TABLE chats ADD COLUMN pinned_message_id UUID;
ALTER TABLE chats ADD CONSTRAINT fk_chats_pinned_message FOREIGN KEY (pinned_message_id) REFERENCES messages(id) ON DELETE SET NULL;
CREATE INDEX idx_chats_pinned_message ON chats(pinned_message_id);
