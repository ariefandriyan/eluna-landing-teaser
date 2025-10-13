# 📊 Supabase Integration Guide

## Database Setup

### 1. Create Table in Supabase

Login ke Supabase Dashboard dan jalankan SQL berikut:

```sql
-- Create early_registrar table
CREATE TABLE early_registrar (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registrar_email TEXT UNIQUE NOT NULL,
  registrar_status INTEGER DEFAULT 0
);

-- Add index for better query performance
CREATE INDEX idx_registrar_email ON early_registrar(registrar_email);
CREATE INDEX idx_registrar_status ON early_registrar(registrar_status);

-- Enable Row Level Security (RLS)
ALTER TABLE early_registrar ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public insert (for registration)
CREATE POLICY "Allow public insert" ON early_registrar
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create policy to allow service role to read/update
CREATE POLICY "Allow service role all" ON early_registrar
  FOR ALL
  TO service_role
  USING (true);
```

### 2. Table Structure

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-increment ID |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Registration timestamp |
| `registrar_email` | TEXT | UNIQUE NOT NULL | User email address |
| `registrar_status` | INTEGER | DEFAULT 0 | 0 = Pending, 1 = Confirmed |

### 3. Environment Variables

Add these to your `.env` file:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and API Keys

## Registration Flow

### Step 1: User Submits Email
```
POST /api/pre-register
Body: { "email": "user@example.com" }
```

### Step 2: Server Process
1. ✅ Validate email format
2. ✅ Check if email already exists in Supabase
3. ✅ Insert new record with `registrar_status = 0`
4. ✅ Send confirmation email (optional)
5. ✅ Return success response

### Step 3: Email Confirmation
```
GET /confirm?token=xxx&email=user@example.com
```

1. ✅ Update `registrar_status` to `1` (Confirmed)
2. ✅ Display thank you page
3. ✅ Show benefits and return button

## Query Examples

### Get all registrations
```sql
SELECT * FROM early_registrar ORDER BY created_at DESC;
```

### Get confirmed users only
```sql
SELECT * FROM early_registrar 
WHERE registrar_status = 1 
ORDER BY created_at DESC;
```

### Count total registrations
```sql
SELECT COUNT(*) as total_registrations FROM early_registrar;
```

### Count by status
```sql
SELECT 
  registrar_status,
  COUNT(*) as count
FROM early_registrar
GROUP BY registrar_status;
```

### Recent registrations (last 24 hours)
```sql
SELECT * FROM early_registrar
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

## API Endpoints

### POST /api/pre-register
**Register new email to waiting list**

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "ok": true
}
```

**Error Responses:**
- `400` - Email tidak valid / Email sudah terdaftar
- `429` - Rate limit exceeded (10 requests per 15 minutes)
- `500` - Server error / Gagal menyimpan data

### GET /confirm
**Confirm email registration**

**Query Parameters:**
- `token` - Confirmation token (required)
- `email` - User email (required)

**Response:**
- HTML page with thank you message
- Updates `registrar_status` to 1 in database

## Security Notes

### ✅ Implemented
- Email validation using `validator` library
- Rate limiting (10 requests per 15 minutes per IP)
- Unique email constraint in database
- Row Level Security (RLS) enabled on Supabase

### ⚠️ TODO
- Add email verification before saving to database
- Implement CAPTCHA for bot protection
- Add admin authentication for database queries
- Set up email domain validation (block disposable emails)

## Troubleshooting

### Email already exists error
```javascript
// Check if email exists in Supabase
const { data: existingUser } = await supabase
  .from('early_registrar')
  .select('registrar_email')
  .eq('registrar_email', email)
  .single();
```

### Connection error to Supabase
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`
- Check if Supabase project is active
- Ensure internet connection is stable

### Row Level Security issues
- Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- Public operations should use `SUPABASE_ANON_KEY`
- Check RLS policies in Supabase dashboard

## Monitoring

### View Registrations in Real-time

1. **Supabase Dashboard:**
   - Go to Table Editor → `early_registrar`
   - View real-time updates

2. **Using SQL Editor:**
   ```sql
   SELECT 
     id,
     registrar_email,
     registrar_status,
     created_at,
     CASE 
       WHEN registrar_status = 0 THEN 'Pending'
       WHEN registrar_status = 1 THEN 'Confirmed'
       ELSE 'Unknown'
     END as status_text
   FROM early_registrar
   ORDER BY created_at DESC
   LIMIT 50;
   ```

3. **Export Data:**
   ```sql
   COPY (
     SELECT * FROM early_registrar ORDER BY created_at DESC
   ) TO '/path/to/export.csv' WITH CSV HEADER;
   ```

## Best Practices

1. **Backup Database Regularly**
   - Use Supabase automatic backups
   - Export data periodically

2. **Monitor Rate Limits**
   - Check for unusual registration patterns
   - Adjust rate limiting if needed

3. **Email Validation**
   - Keep disposable email domains list updated
   - Implement domain whitelist if needed

4. **Data Privacy**
   - Follow GDPR compliance
   - Provide unsubscribe option
   - Clear privacy policy

---

**Created:** 13 October 2025
**Last Updated:** 13 October 2025
