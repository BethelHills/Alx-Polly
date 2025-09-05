-- Polling App Database Schema
-- This file contains the complete database schema for the polling application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create poll_options table
CREATE TABLE IF NOT EXISTS poll_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    text VARCHAR(100) NOT NULL,
    votes INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate votes
    CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id)
);

-- Create audit_logs table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    target_id UUID,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_owner_id ON polls(owner_id);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
CREATE INDEX IF NOT EXISTS idx_polls_is_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_id ON votes(option_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls table
CREATE POLICY "polls_owner_full_access" ON polls 
FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "select_polls" ON polls 
FOR SELECT USING (true);

CREATE POLICY "insert_polls" ON polls 
FOR INSERT USING (auth.role() = 'authenticated');

-- RLS Policies for poll_options table
CREATE POLICY "select_poll_options" ON poll_options 
FOR SELECT USING (true);

CREATE POLICY "insert_poll_options" ON poll_options 
FOR INSERT USING (
    EXISTS (
        SELECT 1 FROM polls 
        WHERE polls.id = poll_options.poll_id 
        AND polls.owner_id = auth.uid()
    )
);

-- RLS Policies for votes table
CREATE POLICY "insert_votes" ON votes 
FOR INSERT USING (auth.role() = 'authenticated');

CREATE POLICY "select_votes_owner" ON votes 
FOR SELECT USING (
    user_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM polls 
        WHERE polls.id = votes.poll_id 
        AND polls.owner_id = auth.uid()
    )
);

-- RLS Policies for audit_logs table
CREATE POLICY "select_audit_logs_owner" ON audit_logs 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "insert_audit_logs" ON audit_logs 
FOR INSERT USING (auth.role() = 'authenticated');

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_polls_updated_at 
    BEFORE UPDATE ON polls 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment vote count
CREATE OR REPLACE FUNCTION increment_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE poll_options 
    SET votes = votes + 1 
    WHERE id = NEW.option_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to decrement vote count
CREATE OR REPLACE FUNCTION decrement_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE poll_options 
    SET votes = votes - 1 
    WHERE id = OLD.option_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Triggers for vote count management
CREATE TRIGGER increment_vote_trigger
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION increment_vote_count();

CREATE TRIGGER decrement_vote_trigger
    AFTER DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_vote_count();

-- Function to validate poll options count
CREATE OR REPLACE FUNCTION validate_poll_options()
RETURNS TRIGGER AS $$
DECLARE
    option_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO option_count
    FROM poll_options
    WHERE poll_id = NEW.poll_id;
    
    IF option_count > 10 THEN
        RAISE EXCEPTION 'Maximum 10 options allowed per poll';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to validate poll options count
CREATE TRIGGER validate_poll_options_trigger
    BEFORE INSERT ON poll_options
    FOR EACH ROW
    EXECUTE FUNCTION validate_poll_options();

-- Add constraints for data integrity
ALTER TABLE polls ADD CONSTRAINT check_title_length CHECK (char_length(title) >= 3);
ALTER TABLE polls ADD CONSTRAINT check_description_length CHECK (char_length(description) <= 500);
ALTER TABLE poll_options ADD CONSTRAINT check_option_text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 100);
ALTER TABLE poll_options ADD CONSTRAINT check_votes_non_negative CHECK (votes >= 0);

-- Comments for documentation
COMMENT ON TABLE polls IS 'Stores poll information and metadata';
COMMENT ON TABLE poll_options IS 'Stores individual options for each poll';
COMMENT ON TABLE votes IS 'Stores user votes with unique constraint per poll';
COMMENT ON TABLE audit_logs IS 'Stores security audit trail for all critical actions';

COMMENT ON COLUMN polls.owner_id IS 'References auth.users(id) - the user who created the poll';
COMMENT ON COLUMN votes.user_id IS 'References auth.users(id) - the user who cast the vote';
COMMENT ON COLUMN audit_logs.user_id IS 'References auth.users(id) - the user who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (poll_created, vote_submitted, etc.)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context about the action in JSON format';
