# 🔧 Troubleshooting: Registrar Status Not Updating

## Problem
Data `registrar_status` di Supabase tidak berubah setelah konfirmasi email dilakukan.

## Possible Causes & Solutions

### 1. Row Level Security (RLS) Policy Issue ⚠️

**Problem:** RLS policy mungkin memblokir UPDATE operation dari anonymous key.

**Solution:** Update policy di Supabase SQL Editor:

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert" ON early_registrar;
DROP POLICY IF EXISTS "Allow service role all" ON early_registrar;
DROP POLICY IF EXISTS "Allow anon update" ON early_registrar;

-- Create policy to allow public insert (for registration)
CREATE POLICY "Allow public insert" ON early_registrar
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow anon update (for email confirmation)
CREATE POLICY "Allow anon update" ON early_registrar
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create policy to allow service role all operations
CREATE POLICY "Allow service role all" ON early_registrar
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Use Service Role Key for Updates

**Alternative Solution:** Use `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_ANON_KEY` for server-side operations.

Update `server.js`:

```javascript
// Use service role key for server operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Changed from ANON_KEY
);
```

**⚠️ Security Note:** Service role key bypasses RLS. Only use it on server-side, NEVER expose it to client.

### 3. Check Column Name

Ensure column name matches exactly:

```sql
-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'early_registrar';
```

Expected columns:
- `id` (bigint)
- `created_at` (timestamp with time zone)
- `registrar_email` (text)
- `registrar_status` (integer)

### 4. Verify Email Exists

Before updating, verify the email exists in database:

```sql
SELECT * FROM early_registrar WHERE registrar_email = 'user@example.com';
```

## Testing the Fix

### 1. Check Current RLS Status

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'early_registrar';
```

### 2. Test Update Manually

```sql
-- Try manual update
UPDATE early_registrar 
SET registrar_status = 1 
WHERE registrar_email = 'test@example.com';

-- Check if updated
SELECT * FROM early_registrar WHERE registrar_email = 'test@example.com';
```

### 3. Monitor Server Logs

Watch the console output when clicking confirmation link:

```bash
npm run dev
```

Look for:
```
Attempting to confirm email: user@example.com
Update result: [ { id: 1, registrar_email: 'user@example.com', ... } ]
Successfully confirmed email: user@example.com
```

If you see:
```
No rows updated. Email might not exist: user@example.com
```

The email doesn't exist in database or RLS is blocking the update.

### 4. Test End-to-End Flow

1. Register new email
2. Check database:
   ```sql
   SELECT * FROM early_registrar ORDER BY created_at DESC LIMIT 1;
   ```
3. Click confirmation link
4. Check if `registrar_status` changed to `1`

## Quick Fix Commands

### Option A: Disable RLS (Development Only)

```sql
-- ⚠️ NOT RECOMMENDED FOR PRODUCTION
ALTER TABLE early_registrar DISABLE ROW LEVEL SECURITY;
```

### Option B: Update Policy (Recommended)

```sql
-- Run the policy update commands from section 1 above
```

### Option C: Use Service Role Key (Server-side)

Update `.env`:
```env
# Change the key used in server.js
SUPABASE_KEY_FOR_SERVER=your-service-role-key
```

Update `server.js`:
```javascript
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

## Verification Checklist

- [ ] RLS policies allow UPDATE for anon role
- [ ] Column name `registrar_status` is correct (no typos)
- [ ] Email exists in database before confirmation
- [ ] Server logs show successful update
- [ ] Supabase dashboard shows `registrar_status = 1` after confirmation

## Common Errors

### Error: "new row violates row-level security policy"
**Fix:** Update RLS policy to allow UPDATE operations

### Error: "column does not exist"
**Fix:** Check column name spelling in code and database

### Error: "No rows updated"
**Fix:** Email might not exist or wrong email format

## Need More Help?

Check Supabase logs:
1. Go to Supabase Dashboard
2. Click "Database" → "Logs"
3. Filter by "postgres_logs"
4. Look for UPDATE errors

---

**Last Updated:** 13 October 2025
