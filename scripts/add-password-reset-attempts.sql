-- Create password_reset_attempts table
CREATE TABLE IF NOT EXISTS password_reset_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    last_attempt TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on ip_address and last_attempt
CREATE INDEX IF NOT EXISTS idx_password_reset_attempts_ip_time 
ON password_reset_attempts(ip_address, last_attempt);

-- Add cleanup function for expired attempts
CREATE OR REPLACE FUNCTION cleanup_expired_password_attempts() RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_attempts 
    WHERE last_attempt < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;