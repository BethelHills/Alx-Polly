-- Migration 002: Add Constraints and Row Level Security
-- This migration adds security constraints and RLS policies

-- Add unique constraint to prevent duplicate votes
ALTER TABLE votes ADD CONSTRAINT unique_user_poll_vote UNIQUE (poll_id, user_id);

-- Add data integrity constraints
ALTER TABLE polls ADD CONSTRAINT check_title_length CHECK (char_length(title) >= 3);
ALTER TABLE polls ADD CONSTRAINT check_description_length CHECK (char_length(description) <= 500);
ALTER TABLE poll_options ADD CONSTRAINT check_option_text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 100);
ALTER TABLE poll_options ADD CONSTRAINT check_votes_non_negative CHECK (votes >= 0);

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
