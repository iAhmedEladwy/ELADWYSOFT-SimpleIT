-- Migration Script: Employee Self-Registration
-- Adds registration_tokens table for email verification
-- Version: 1.0.1
-- Date: 2025-11-19

-- Create registration_tokens table
CREATE TABLE IF NOT EXISTS registration_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT false
);

-- Create index on token for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_tokens_email ON registration_tokens(email);

-- Create index on expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_registration_tokens_expires_at ON registration_tokens(expires_at);

-- Verification query
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'registration_tokens'
ORDER BY ordinal_position;

-- Show indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'registration_tokens';
