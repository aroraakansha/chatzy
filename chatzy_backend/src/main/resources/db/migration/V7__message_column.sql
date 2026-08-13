ALTER TABLE messages
    ADD COLUMN recipient_id UUID REFERENCES users(id);


ALTER TABLE messages
    ADD COLUMN status delivery_status DEFAULT 'SENT';