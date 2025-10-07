-- Add lumi_dashboard_message column to primary_test_results table
-- This column stores cached AI-generated mascot message for dashboard

ALTER TABLE primary_test_results
ADD COLUMN IF NOT EXISTS lumi_dashboard_message TEXT;

-- Add comment to explain the column purpose
COMMENT ON COLUMN primary_test_results.lumi_dashboard_message IS 'Cached AI-generated welcome message from Lumi mascot for dashboard';

