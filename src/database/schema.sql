-- DropDown Bot Database Schema

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Metadata table for system information
CREATE TABLE IF NOT EXISTS metadata (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial metadata
INSERT INTO metadata (key, value) VALUES 
    ('version', '1.0'),
    ('max_characters', '25'),
    ('last_migration', CURRENT_TIMESTAMP::TEXT)
ON CONFLICT (key) DO NOTHING;

-- Insert initial character data
INSERT INTO characters (name) VALUES 
    ('春麗'),
    ('リュウ'),
    ('ケン'),
    ('ザンギエフ')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(name);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metadata_updated_at BEFORE UPDATE ON metadata
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();