# 🚨 URGENT: Database Column Missing Fix

## Problem
The column `lumi_dashboard_message` does not exist in the `primary_test_results` table, causing the mascot message generation to fail.

Also, `personal_plan_unlocked` is `false` for user `deve` (sessionId: `48528d64-9f6f-40e8-b1f4-ce39d97eb84b`) even though they have paid.

## Quick Fix

### 1. Add Missing Column

Go to **Supabase SQL Editor** and run:

```sql
-- Add lumi_dashboard_message column
ALTER TABLE primary_test_results
ADD COLUMN IF NOT EXISTS lumi_dashboard_message TEXT;

-- Add comment
COMMENT ON COLUMN primary_test_results.lumi_dashboard_message IS 'Cached AI-generated welcome message from Lumi mascot for dashboard';
```

### 2. Unlock Personal Plan for User

Run this SQL to unlock the personal plan for the specific user:

```sql
-- Unlock personal plan for user 'deve'
UPDATE primary_test_results
SET personal_plan_unlocked = true
WHERE session_id = '48528d64-9f6f-40e8-b1f4-ce39d97eb84b';

-- Verify the update
SELECT session_id, nickname, personal_plan_unlocked
FROM primary_test_results
WHERE session_id = '48528d64-9f6f-40e8-b1f4-ce39d97eb84b';
```

### 3. After Migration - Enable Caching

After running the migration, uncomment the caching logic in `server/routes/ai.js`:

Search for `TODO: Раскомментировать после применения миграции` and uncomment:
- Line ~349-362: Check for cached message
- Line ~403-416: Save message to database

## Steps

1. ✅ Open [Supabase Dashboard](https://app.supabase.com/)
2. ✅ Go to **SQL Editor**
3. ✅ Run the SQL from sections 1 and 2 above
4. ✅ Deploy the code changes (already committed)
5. ✅ Test login to dashboard
6. ✅ Verify mascot generates message
7. ✅ Verify personal plan is unlocked

## Expected Result

After running the SQL:

```
✅ Column `lumi_dashboard_message` exists
✅ User 'deve' has `personal_plan_unlocked = true`
✅ Mascot generates AI message on dashboard
✅ Recommended tests are shown
```

## Verification Query

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'primary_test_results'
ORDER BY ordinal_position;

-- Check user status
SELECT 
  session_id,
  nickname,
  personal_plan_unlocked,
  lumi_dashboard_message IS NOT NULL as has_cached_message,
  created_at,
  updated_at
FROM primary_test_results
WHERE nickname = 'deve';
```

