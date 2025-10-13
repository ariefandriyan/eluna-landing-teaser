import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer';
import validator from 'validator';
import crypto from 'crypto';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';

// Load environment variables
dotenv.config();

// ES6 module path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create livereload server in development mode
if (process.env.NODE_ENV !== 'production') {
  const liveReloadServer = livereload.createServer({
    exts: ['html', 'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg'],
    delay: 100
  });
  liveReloadServer.watch(path.join(__dirname, 'public'));
  console.log('🔄 Live reload enabled - watching public folder');
}

// Initialize Express app
const app = express();

// Use livereload middleware in development
if (process.env.NODE_ENV !== 'production') {
  app.use(connectLivereload());
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Rate limiting for API routes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});
app.use('/api/', limiter);

// Initialize SQLite database
const db = await open({ 
  filename: path.join(__dirname, 'data.sqlite'), 
  driver: sqlite3.Database 
});

// Create waitlist table if it doesn't exist
await db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed INTEGER DEFAULT 0,
    token TEXT
  );
`);

// Mail transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  },
});

// Pre-registration endpoint
app.post('/api/pre-register', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    
    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email tidak valid' });
    }

    // Generate unique token for email confirmation
    const token = cryptoRandom(32);
    
    // Insert or ignore if email already exists
    await db.run('INSERT OR IGNORE INTO waitlist(email, token) VALUES (?, ?)', email, token);
    
    // Update token if email exists but not confirmed
    const existingUser = await db.get('SELECT email FROM waitlist WHERE email=?', email);
    const confirmedUser = await db.get('SELECT confirmed FROM waitlist WHERE email=? AND confirmed=1', email);
    
    if (existingUser && !confirmedUser) {
      await db.run('UPDATE waitlist SET token=? WHERE email=?', token, email);
    }

    // Generate confirmation URL
    const confirmUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/confirm?token=${token}`;

    // Send confirmation email
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'Eluna.ID <no-reply@eluna.id>',
      to: email,
      subject: 'Kamu ada di waiting list Eluna.ID ✨',
      text: `Terima kasih sudah pre-register! Klik konfirmasi: ${confirmUrl}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;font-size:15px;color:#0f172a">
          <p>Terima kasih sudah pre-register di <b>Eluna.ID</b>! 🎉</p>
          <p>Konfirmasi email kamu dengan tombol di bawah agar resmi masuk waiting list.</p>
          <p>
            <a href="${confirmUrl}" style="display:inline-block;padding:10px 16px;border-radius:12px;background:#6366f1;color:#fff;text-decoration:none">
              Konfirmasi
            </a>
          </p>
          <p style="color:#64748b">
            Jika tombol tidak berfungsi, buka link ini: <br/>
            ${confirmUrl}
          </p>
        </div>
      `
    });

    return res.json({ ok: true });
    
  } catch (error) {
    console.error('Pre-registration error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Email confirmation endpoint
app.get('/confirm', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    const row = await db.get('SELECT id, email FROM waitlist WHERE token=?', token);
    
    if (!row) {
      return res.status(400).send('Token tidak valid');
    }
    
    // Mark email as confirmed
    await db.run('UPDATE waitlist SET confirmed=1 WHERE id=?', row.id);
    
    // Send confirmation page
    res.send(`
      <html>
        <body style="font-family:Inter,Arial">
          <h3>✅ Email dikonfirmasi.</h3>
          <p>${row.email} resmi bergabung dalam waiting list. Sampai jumpa saat pre‑launch!</p>
          <a href="/" style="display:inline-block;margin-top:8px">Kembali</a>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Confirmation error:', error);
    return res.status(500).send('Terjadi kesalahan saat konfirmasi');
  }
});

// Admin endpoint to view waitlist
app.get('/api/admin/waitlist', async (_req, res) => {
  try {
    const rows = await db.all('SELECT id, email, created_at, confirmed FROM waitlist ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Admin waitlist error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Start server
const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Eluna.ID teaser running on http://localhost:${PORT}`);
});

// Utility function to generate cryptographically secure random string
function cryptoRandom(len = 32) {
  return [...crypto.getRandomValues(new Uint8Array(len))]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}