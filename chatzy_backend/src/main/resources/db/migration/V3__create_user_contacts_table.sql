-- V3__create_user_contacts_table.sql

CREATE TABLE user_contacts (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id         UUID         NOT NULL,
    matched_user_id  UUID,
    contact_name     VARCHAR(150) NOT NULL,
    contact_email    VARCHAR(255),
    contact_phone    VARCHAR(20),
    source           VARCHAR(20)  DEFAULT 'GOOGLE',
    is_blocked       BOOLEAN      DEFAULT FALSE,
    is_favorite      BOOLEAN      DEFAULT FALSE,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_contact_owner
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_contact_matched_user
        FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE SET NULL,

    CHECK (contact_email IS NOT NULL OR contact_phone IS NOT NULL),
    CHECK (matched_user_id IS DISTINCT FROM owner_id)
);

CREATE UNIQUE INDEX uq_user_contacts_owner_email
    ON user_contacts(owner_id, contact_email)
    WHERE contact_email IS NOT NULL;

CREATE UNIQUE INDEX uq_user_contacts_owner_phone
    ON user_contacts(owner_id, contact_phone)
    WHERE contact_phone IS NOT NULL;

CREATE INDEX idx_user_contacts_owner   ON user_contacts(owner_id);
CREATE INDEX idx_user_contacts_matched ON user_contacts(matched_user_id) WHERE matched_user_id IS NOT NULL;
CREATE INDEX idx_user_contacts_phone   ON user_contacts(contact_phone);
CREATE INDEX idx_user_contacts_email   ON user_contacts(contact_email);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_contacts_updated_at
    BEFORE UPDATE ON user_contacts
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();