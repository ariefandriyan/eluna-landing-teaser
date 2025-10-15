import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
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

// Template helper functions
async function loadTemplate(templateName, replacements = {}) {
  try {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // Replace placeholders with actual values
    for (const [key, value] of Object.entries(replacements)) {
      const placeholder = `{{${key}}}`;
      template = template.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return template;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

async function loadEmailTemplate(confirmUrl) {
  return await loadTemplate('email-confirmation', {
    CONFIRM_URL: confirmUrl
  });
}

async function loadThankYouTemplate(email) {
  return await loadTemplate('thank-you', {
    USER_EMAIL: email
  });
}

async function loadErrorTemplate(errorMessage) {
  return await loadTemplate('error', {
    ERROR_MESSAGE: errorMessage
  });
}

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

    // Load email template
    const emailHtml = await loadEmailTemplate(confirmUrl);

    // Send confirmation email
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'Eluna.ID <no-reply@eluna.id>',
        to: email,
        subject: 'Kamu ada di waiting list Eluna.ID ✨',
        text: `Terima kasih sudah pre-register! Klik konfirmasi: ${confirmUrl}`,
        html: emailHtml
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
      const errorHtml = await loadErrorTemplate(error.message);
      return res.status(500).send(errorHtml);
    }

    console.log('Update result:', data);
    
    if (!data || data.length === 0) {
      console.warn('No rows updated. Email might not exist:', email);
    } else {
      console.log('Successfully confirmed email:', email);
    }
    
    // Load and send thank you page
    const thankYouHtml = await loadThankYouTemplate(email);
    res.send(thankYouHtml);
    
  } catch (error) {
    console.error('Confirmation error:', error);
    const errorHtml = await loadErrorTemplate(error.message);
    return res.status(500).send(errorHtml);
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