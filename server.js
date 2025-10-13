import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
    
    // Generate confirmation URL
    const confirmUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/confirm?token=${token}&email=${encodeURIComponent(email)}`;

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
            <a href="${confirmUrl}" style="display:inline-block;padding:10px 16px;border-radius:12px;background:#003084;color:#fff;text-decoration:none">
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
    const email = String(req.query.email || '');
    
    if (!token || !email) {
      return res.status(400).send('Token atau email tidak valid');
    }
    
    // Send confirmation page
    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: 'Nunito Sans', Inter, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              padding: 40px;
              border-radius: 20px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              max-width: 500px;
            }
            h3 { color: #003084; margin-bottom: 16px; }
            p { color: #64748b; line-height: 1.6; }
            a {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background: #003084;
              color: white;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              transition: all 0.3s;
            }
            a:hover {
              background: #002060;
              transform: translateY(-2px);
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h3>✅ Email dikonfirmasi!</h3>
            <p><strong>${email}</strong> resmi bergabung dalam waiting list Eluna.ID.</p>
            <p>Kami akan menghubungi kamu segera saat pre‑launch! 🎉</p>
            <a href="/">Kembali ke Halaman Utama</a>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Confirmation error:', error);
    return res.status(500).send('Terjadi kesalahan saat konfirmasi');
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