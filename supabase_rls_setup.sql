-- =====================================================
-- SUPABASE RLS POLICY SETUP FOR EARLY_REGISTRAR TABLE
-- =====================================================
-- Run this in Supabase SQL Editor
-- Last Updated: 13 October 2025
-- 
-- NOTE: If RLS is disabled, you can skip policy setup
-- The server will work with ANON_KEY directly
-- =====================================================

-- Option 1: DISABLE RLS (Simplest - Currently Active)
-- =====================================================
ALTER TABLE early_registrar DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'early_registrar';
-- Should show: rls_enabled = false

-- =====================================================
-- Option 2: ENABLE RLS with Policies (More Secure)
-- =====================================================
-- Uncomment below if you want to re-enable RLS

/*
-- Enable RLS
ALTER TABLE early_registrar ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Allow public insert" ON early_registrar;
DROP POLICY IF EXISTS "Allow service role all" ON early_registrar;
DROP POLICY IF EXISTS "Allow anon update" ON early_registrar;
DROP POLICY IF EXISTS "Enable insert for anon users" ON early_registrar;
DROP POLICY IF EXISTS "Enable update for anon users" ON early_registrar;
DROP POLICY IF EXISTS "Enable read for anon users" ON early_registrar;

-- Create new policies

-- Policy 1: Allow INSERT for authenticated and anon users
CREATE POLICY "Enable insert for public"
ON early_registrar
FOR INSERT
TO public
WITH CHECK (true);

-- Policy 2: Allow UPDATE for authenticated and anon users
CREATE POLICY "Enable update for public"
ON early_registrar
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy 3: Allow SELECT for authenticated and anon users
CREATE POLICY "Enable select for public"
ON early_registrar
FOR SELECT
TO public
USING (true);

-- Policy 4: Allow service role full access (bypass RLS)
CREATE POLICY "Service role full access"
ON early_registrar
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Grant permissions on table
GRANT SELECT, INSERT, UPDATE ON early_registrar TO anon, authenticated;
GRANT ALL ON early_registrar TO service_role;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Step 1: Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'early_registrar'
) as table_exists;

-- Step 2: View current table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'early_registrar'
ORDER BY ordinal_position;

-- Step 3: Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Enabled - Policies Required'
    ELSE '🔓 RLS Disabled - Direct Access'
  END as status_message
FROM pg_tables
WHERE tablename = 'early_registrar';

-- Step 4: View existing policies (if RLS enabled)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'early_registrar';

-- Step 5: Test data - Check current records
SELECT 
  id,
  registrar_email,
  registrar_status,
  CASE 
    WHEN registrar_status = 0 THEN '❌ Pending'
    WHEN registrar_status = 1 THEN '✅ Confirmed'
    ELSE '❓ Unknown'
  END as status_display,
  created_at
FROM early_registrar
ORDER BY created_at DESC
LIMIT 10;

-- Step 6: Count by status
SELECT 
  registrar_status,
  CASE 
    WHEN registrar_status = 0 THEN 'Pending'
    WHEN registrar_status = 1 THEN 'Confirmed'
    ELSE 'Unknown'
  END as status_name,
  COUNT(*) as count
FROM early_registrar
GROUP BY registrar_status
ORDER BY registrar_status;

-- =====================================================
-- VERIFICATION SUMMARY
-- =====================================================

SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN rowsecurity THEN '🔒 Enabled (Needs Policies)'
    ELSE '🔓 Disabled (Direct Access)'
  END as status
FROM pg_tables
WHERE tablename = 'early_registrar'

UNION ALL

SELECT 
  'Policy Count' as check_type,
  COALESCE(COUNT(*)::text, '0') || ' policies' as status
FROM pg_policies
WHERE tablename = 'early_registrar'

UNION ALL

SELECT 
  'Total Records' as check_type,
  COUNT(*)::text || ' records' as status
FROM early_registrar;

-- =====================================================
-- OPTIONAL: Reset all status to 0 for testing
-- =====================================================
-- Uncomment to reset all registrations to pending status
-- UPDATE early_registrar SET registrar_status = 0;

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test 1: Insert a test record
/*
INSERT INTO early_registrar (registrar_email, registrar_status)
VALUES ('test@example.com', 0)
ON CONFLICT (registrar_email) DO NOTHING;
*/

-- Test 2: Update the test record
/*
UPDATE early_registrar 
SET registrar_status = 1 
WHERE registrar_email = 'test@example.com';
*/

-- Test 3: Verify the update worked
/*
SELECT * FROM early_registrar 
WHERE registrar_email = 'test@example.com';
*/

-- Test 4: Delete test record
/*
DELETE FROM early_registrar 
WHERE registrar_email = 'test@example.com';
*/

-- =====================================================
-- GRANT PERMISSIONS (if needed)
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on table
GRANT SELECT, INSERT, UPDATE ON early_registrar TO anon, authenticated;
GRANT ALL ON early_registrar TO service_role;

-- Grant sequence permissions for id column
GRANT USAGE, SELECT ON SEQUENCE early_registrar_id_seq TO anon, authenticated, service_role;

-- =====================================================
-- VERIFY EVERYTHING IS WORKING
-- =====================================================

-- Test 1: Check RLS status
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS ENABLED - Requires policies'
    ELSE '🔓 RLS DISABLED - No policies needed (Current)'
  END as rls_status
FROM pg_tables
WHERE tablename = 'early_registrar';

-- Test 2: Try INSERT (should work with RLS disabled)
/*
INSERT INTO early_registrar (registrar_email, registrar_status)
VALUES ('test-rls@example.com', 0)
ON CONFLICT (registrar_email) DO NOTHING
RETURNING *;
*/

-- Test 3: Try UPDATE (should work with RLS disabled)
/*
UPDATE early_registrar 
SET registrar_status = 1 
WHERE registrar_email = 'test-rls@example.com'
RETURNING *;
*/

-- Test 4: Clean up test data
/*
DELETE FROM early_registrar 
WHERE registrar_email = 'test-rls@example.com';
*/

-- =====================================================
-- DONE! 🎉
-- =====================================================
-- With RLS DISABLED:
-- ✅ ANON_KEY can INSERT, UPDATE, SELECT, DELETE
-- ✅ No policies needed
-- ✅ Simpler setup for development
-- 
-- For Production:
-- ⚠️ Consider enabling RLS with proper policies
-- ⚠️ Or use SERVICE_ROLE_KEY on server side
-- =====================================================
