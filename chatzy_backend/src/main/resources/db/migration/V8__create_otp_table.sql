CREATE TABLE otps (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    purpose VARCHAR(50) NOT NULL
);

CREATE INDEX idx_otp_email ON otps(email);
CREATE INDEX idx_otp_code ON otps(code);
CREATE INDEX idx_otp_expires_at ON otps(expires_at);
