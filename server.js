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
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease set these in your .env file or deployment platform.');
  process.exit(1);
}

// Log environment variable status (without showing actual values)
console.log('📋 Environment variables check:');
console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

// Initialize Supabase client
// Using ANON_KEY since RLS is disabled on the table
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('✅ Supabase initialized successfully');

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

    // Check if email already exists in Supabase
    const { data: existingUser, error: checkError } = await supabase
      .from('early_registrar')
      .select('registrar_email')
      .eq('registrar_email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    // Insert email into Supabase
    const { data, error } = await supabase
      .from('early_registrar')
      .insert([
        { 
          registrar_email: email,
          registrar_status: 0
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Gagal menyimpan data' });
    }

    // Generate unique token for email confirmation
    const token = cryptoRandom(32);
    
    // Generate confirmation URL
    const confirmUrl = `${process.env.PUBLIC_URL || 'http://localhost:3000'}/confirm?token=${token}&email=${encodeURIComponent(email)}`;

    // Send confirmation email
    try {
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
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue even if email fails, data already saved
    }

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

    console.log('Attempting to confirm email:', email);

    // Update registrar_status to 1 (confirmed) in Supabase
    const { data, error } = await supabase
      .from('early_registrar')
      .update({ registrar_status: 1 })
      .eq('registrar_email', email)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Error - Eluna.ID</title>
            <style>
              body {
                font-family: 'Nunito Sans', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: #f87171;
                padding: 20px;
              }
              .card {
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                max-width: 500px;
              }
              h1 { color: #dc2626; margin-bottom: 16px; }
              p { color: #64748b; line-height: 1.6; }
              a {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #dc2626;
                color: white;
                text-decoration: none;
                border-radius: 12px;
              }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>❌ Gagal Konfirmasi</h1>
              <p>Maaf, terjadi kesalahan saat mengkonfirmasi email.</p>
              <p>Error: ${error.message}</p>
              <a href="/">Kembali ke Halaman Utama</a>
            </div>
          </body>
        </html>
      `);
    }

    console.log('Update result:', data);
    
    if (!data || data.length === 0) {
      console.warn('No rows updated. Email might not exist:', email);
    } else {
      console.log('Successfully confirmed email:', email);
    }
    
    // Send confirmation page
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Terima Kasih - Eluna.ID</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Nunito Sans', Inter, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #003084 0%, #0066CC 50%, #4A90E2 100%);
              padding: 20px;
            }
            .card {
              background: white;
              padding: 60px 40px;
              border-radius: 24px;
              box-shadow: 0 30px 90px rgba(0,0,0,0.4);
              text-align: center;
              max-width: 600px;
              width: 100%;
              animation: slideUp 0.6s ease-out;
            }
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .icon {
              font-size: 80px;
              margin-bottom: 20px;
              animation: bounce 1s ease-in-out;
            }
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-20px); }
            }
            h1 { 
              color: #003084; 
              margin-bottom: 16px;
              font-size: 32px;
              font-weight: 800;
            }
            .email {
              color: #003084;
              font-weight: 700;
              font-size: 18px;
            }
            p { 
              color: #64748b; 
              line-height: 1.8;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .highlight {
              background: linear-gradient(135deg, #003084 0%, #0066CC 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              font-weight: 700;
            }
            a {
              display: inline-block;
              margin-top: 30px;
              padding: 16px 40px;
              background: linear-gradient(135deg, #003084 0%, #0066CC 100%);
              color: white;
              text-decoration: none;
              border-radius: 16px;
              font-weight: 700;
              font-size: 16px;
              transition: all 0.3s ease;
              box-shadow: 0 4px 15px rgba(0, 48, 132, 0.3);
            }
            a:hover {
              transform: translateY(-3px);
              box-shadow: 0 8px 25px rgba(0, 48, 132, 0.5);
            }
            a:active {
              transform: translateY(-1px);
            }
            .benefits {
              margin-top: 30px;
              padding-top: 30px;
              border-top: 2px solid #f1f5f9;
            }
            .benefit-item {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin: 12px 0;
              color: #475569;
              font-size: 15px;
            }
            .benefit-icon {
              font-size: 24px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">🎉</div>
            <h1>Terima Kasih Sudah Bergabung!</h1>
            <p>Email <span class="email">${email}</span> resmi terdaftar dalam waiting list Eluna.ID.</p>
            <p>Kami akan menghubungi kamu segera saat <span class="highlight">pre-launch</span>!</p>
            
            <div class="benefits">
              <div class="benefit-item">
                <span class="benefit-icon">🎯</span>
                <span>Prioritas pemilihan username</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">💎</span>
                <span>Bonus poin eksklusif</span>
              </div>
              <div class="benefit-item">
                <span class="benefit-icon">💬</span>
                <span>Early access ke fitur baru</span>
              </div>
            </div>
            
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