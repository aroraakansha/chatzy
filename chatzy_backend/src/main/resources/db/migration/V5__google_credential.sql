-- V4__create_google_credentials_table.sql

CREATE TABLE google_credentials (
                                    user_id                  UUID PRIMARY KEY,
                                    access_token             TEXT NOT NULL,
                                    refresh_token            TEXT,
                                    access_token_expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
                                    created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                                    updated_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

                                    CONSTRAINT fk_google_credentials_user
                                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER trg_google_credentials_updated_at
    BEFORE UPDATE ON google_credentials
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();