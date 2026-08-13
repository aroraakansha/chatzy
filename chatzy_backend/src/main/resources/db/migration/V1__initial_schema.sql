-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- ENUMS  (defined once, reused everywhere)
-- ─────────────────────────────────────────

CREATE TYPE user_status     AS ENUM ('ONLINE', 'OFFLINE');
CREATE TYPE chat_type       AS ENUM ('PRIVATE', 'GROUP', 'BROADCAST');
CREATE TYPE member_role     AS ENUM ('MEMBER', 'ADMIN', 'SUPER_ADMIN');
CREATE TYPE message_type    AS ENUM (
  'TEXT', 'IMAGE', 'VIDEO', 'AUDIO',
  'DOCUMENT', 'VOICE_NOTE', 'STICKER',
  'LOCATION', 'CONTACT', 'SYSTEM'
);
CREATE TYPE delivery_status AS ENUM ('SENT', 'DELIVERED', 'READ');

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
                                     id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL, -- Added email back since it's required for auth
    password        VARCHAR(255) NOT NULL,        -- Added password back
    display_name    VARCHAR(100) NOT NULL,
    phone_number    VARCHAR(20) UNIQUE,
    avatar_url      TEXT,
    about           TEXT        DEFAULT 'Hey there! I am using WhatsApp.',
    status          user_status DEFAULT 'OFFLINE',
    last_seen       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
-- ─────────────────────────────────────────
-- CHATS
-- ─────────────────────────────────────────

CREATE TABLE chats (
                       id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
                       type             chat_type NOT NULL DEFAULT 'PRIVATE',
                       name             VARCHAR(100),             -- only for GROUP/BROADCAST
                       description      TEXT,
                       avatar_url       TEXT,
                       created_by       UUID      REFERENCES users(id) ON DELETE SET NULL,
                       last_message_id  UUID,                     -- FK added after messages table
                       last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                       created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CHAT MEMBERS  (the join table)
-- ─────────────────────────────────────────

CREATE TABLE chat_members (
                              id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                              chat_id     UUID        NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                              user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                              role        member_role DEFAULT 'MEMBER',
                              is_muted    BOOLEAN     DEFAULT FALSE,
                              is_archived BOOLEAN     DEFAULT FALSE,
                              joined_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                              left_at     TIMESTAMP WITH TIME ZONE,      -- NULL = still in chat
                              UNIQUE(chat_id, user_id)
);

-- ─────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────

CREATE TABLE messages (
                          id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
                          chat_id              UUID         NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
                          sender_id            UUID         NOT NULL REFERENCES users(id) ON DELETE SET NULL,
                          reply_to_id          UUID         REFERENCES messages(id) ON DELETE SET NULL,  -- quoted reply
                          type                 message_type NOT NULL DEFAULT 'TEXT',
                          content              TEXT,                      -- text body or caption
                          media_url            TEXT,                      -- S3/storage URL
                          media_mime_type      VARCHAR(100),
                          media_size_bytes     INTEGER,
                          media_thumbnail_url  TEXT,
                          media_duration_secs  INTEGER,                   -- for audio/video
                          is_deleted           BOOLEAN      DEFAULT FALSE, -- "This message was deleted"
                          is_edited            BOOLEAN      DEFAULT FALSE,
                          edited_at            TIMESTAMP WITH TIME ZONE,
                          sent_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                          created_at           TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the deferred FK now that messages exists
ALTER TABLE chats
    ADD CONSTRAINT fk_last_message
        FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
-- MESSAGE STATUS  (per recipient, per message)
-- ─────────────────────────────────────────

CREATE TABLE message_status (
                                id           UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
                                message_id   UUID            NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                                user_id      UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                status       delivery_status NOT NULL DEFAULT 'SENT',
                                delivered_at TIMESTAMP WITH TIME ZONE,
                                read_at      TIMESTAMP WITH TIME ZONE,
                                UNIQUE(message_id, user_id)
);

-- ─────────────────────────────────────────
-- REACTIONS  (emoji reactions on messages)
-- ─────────────────────────────────────────

CREATE TABLE reactions (
                           id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
                           user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
                           emoji      VARCHAR(10) NOT NULL,
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                           UNIQUE(message_id, user_id)   -- one reaction per user per message
);

-- ─────────────────────────────────────────
-- MEDIA FILES  (tracks all uploaded files)
-- ─────────────────────────────────────────

CREATE TABLE media_files (
                             id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             uploaded_by    UUID REFERENCES users(id) ON DELETE SET NULL,
                             file_key       TEXT NOT NULL,           -- S3 object key
                             bucket_name    VARCHAR(100) NOT NULL,
                             original_name  TEXT,
                             mime_type      VARCHAR(100) NOT NULL,
                             size_bytes     INTEGER,
                             thumbnail_key  TEXT,
                             width_px       INTEGER,
                             height_px      INTEGER,
                             duration_secs  INTEGER,
                             created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES  (never skip these)
-- ─────────────────────────────────────────

-- Fastest way to load a chat's messages (most common query)
CREATE INDEX idx_messages_chat_id_sent_at   ON messages(chat_id, sent_at DESC);

-- Load all chats for a user (sidebar list)
CREATE INDEX idx_chat_members_user_id       ON chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id       ON chat_members(chat_id);

-- Check unread counts fast
CREATE INDEX idx_message_status_user_status ON message_status(user_id, status);
CREATE INDEX idx_message_status_message_id  ON message_status(message_id);

-- Reaction lookup per message
CREATE INDEX idx_reactions_message_id       ON reactions(message_id);

-- Sort chat list by latest activity
CREATE INDEX idx_chats_last_activity        ON chats(last_activity_at DESC);