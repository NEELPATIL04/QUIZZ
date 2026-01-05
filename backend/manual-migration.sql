-- Manual Migration for Git Quiz System
-- Run this SQL script in your PostgreSQL database

-- 1. Add new question types to enum (if not exists)
DO $$ BEGIN
    CREATE TYPE question_type AS ENUM ('git_challenge', 'multiple_choice', 'text_answer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add questionType column to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS question_type question_type DEFAULT 'text_answer';

-- 3. Add Git challenge fields to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS story TEXT,
ADD COLUMN IF NOT EXISTS available_commands TEXT,
ADD COLUMN IF NOT EXISTS completed_commands TEXT;

-- 4. Add timing fields to team_answers table
ALTER TABLE team_answers
ADD COLUMN IF NOT EXISTS time_started TIMESTAMP,
ADD COLUMN IF NOT EXISTS time_completed TIMESTAMP,
ADD COLUMN IF NOT EXISTS time_taken INTEGER;

-- 5. Add showAnswers to quiz_config table
ALTER TABLE quiz_config
ADD COLUMN IF NOT EXISTS show_answers BOOLEAN NOT NULL DEFAULT false;

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'team_answers'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'quiz_config'
ORDER BY ordinal_position;
