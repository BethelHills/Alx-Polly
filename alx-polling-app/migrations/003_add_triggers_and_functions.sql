-- Migration 003: Add Triggers and Functions
-- This migration adds database triggers and functions for automation

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
