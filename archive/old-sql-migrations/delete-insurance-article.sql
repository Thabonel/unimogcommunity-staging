-- Script to delete the problematic Insurance article from the database
-- Run this in Supabase SQL Editor

-- First, check if the article exists and get its details
SELECT id, title, category, author_name, created_at 
FROM community_articles 
WHERE title = 'Insurance and Registration Guide for Unimogs in Australia';

-- Delete the article
DELETE FROM community_articles 
WHERE title = 'Insurance and Registration Guide for Unimogs in Australia';

-- Verify deletion
SELECT COUNT(*) as remaining_count
FROM community_articles 
WHERE title = 'Insurance and Registration Guide for Unimogs in Australia';

-- The count should be 0 after deletion