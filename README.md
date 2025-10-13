# 🎉 Eluna.ID - Pre-launch Waiting List

![Eluna.ID](public/logo/Grand%20Logo.png)

> Platform rewards modern untuk brand dan konsumen Indonesia - Simpel, bernilai, dan penuh kejutan ✨

Landing page pre-launch dengan sistem waiting list dan email confirmation untuk Eluna.ID. Dibangun dengan Node.js, Express, dan Supabase dengan desain modern dan clean menggunakan Tailwind CSS.

## ✨ Fitur

- 🎯 **Pre-registration System** - Sistem pendaftaran waiting list dengan validasi email
- 📧 **Email Confirmation** - Verifikasi email otomatis dengan secure token
- 💾 **Supabase Database** - Penyimpanan data waitlist di cloud dengan real-time capabilities
- 🎨 **Modern UI/UX** - Desain clean dengan split-screen layout dan Nunito Sans font
- ⌨️ **Typing Animation** - Animated headline menggunakan Typed.js
- 🔄 **Hot Reload** - Development dengan live reload untuk perubahan real-time
- 🛡️ **Rate Limiting** - Proteksi API dengan rate limit 10 requests/15 menit
- 🐳 **Docker Ready** - Full containerization dengan Docker Compose
- 📱 **Responsive Design** - Mobile-first design yang fit dalam 1 page tanpa scroll
- 🎨 **Glass Morphism** - Efek glass dengan backdrop blur untuk UI modern
- 🌐 **Background Pattern** - Animated rotating logo pattern dengan color variations

## 🚀 Quick Start

### Prerequisites

- Node.js v20.x atau lebih tinggi
- npm atau yarn
- (Optional) Docker & Docker Compose untuk containerization

### Installation

1. **Clone repository**
   ```bash
   git clone https://github.com/ariefandriyan/eluna-landing-teaser.git
   cd eluna-landing-teaser
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` dengan konfigurasi Anda:
   ```env
   PORT=3000
   BASE_URL=http://localhost:3000
   
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # SMTP Configuration (untuk production)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   # Development (MailDev - sudah dikonfigurasi)
   # SMTP_HOST=localhost
   # SMTP_PORT=1025
   ```

4. **Setup Supabase Database**
   
   Lihat [SUPABASE_SETUP.md](SUPABASE_SETUP.md) untuk instruksi lengkap membuat table dan konfigurasi.
   
   Quick setup:
   ```sql
   CREATE TABLE early_registrar (
     id BIGSERIAL PRIMARY KEY,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     registrar_email TEXT UNIQUE NOT NULL,
     registrar_status INTEGER DEFAULT 0
   );
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Server akan berjalan di `http://localhost:3000` dengan hot reload aktif! 🔥

### Production

```bash
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build dan jalankan semua services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services yang berjalan:
- **Web App**: `http://localhost:3000`
- **MailDev** (Email testing): `http://localhost:1080`

### Using Docker

```bash
# Build image
docker build -t eluna-teaser .

# Run container
docker run -p 3000:3000 eluna-teaser
```

## 📁 Struktur Proyek

```
eluna-teaser/
├── public/                  # Static files
│   ├── index.html          # Landing page dengan split-screen design
│   └── logo/               # Logo assets (Grand Logo.png, Logogram.png)
├── server.js               # Express server dengan API endpoints
├── data.sqlite             # SQLite database (auto-created)
├── package.json            # Dependencies dan scripts
├── nodemon.json            # Nodemon configuration untuk hot reload
├── Dockerfile              # Docker image configuration
├── docker-compose.yml      # Multi-container setup
├── .dockerignore           # Docker build exclusions
├── .env                    # Environment variables (gitignored)
├── HOT_RELOAD.md          # Hot reload documentation
└── README.md              # This file
```

## 🎨 Design Features

### Color Palette
- **Primary Blue**: `#003084` - Brand color untuk highlights dan CTAs
- **White Background**: `#FFFFFF` - Clean base color
- **Gray Scale**: Untuk teks dan subtle UI elements
- **Glass Effects**: `rgba(255, 255, 255, 0.95)` dengan backdrop blur

### Typography
- **Font Family**: Nunito Sans (Variable font 200-1000)
- **Default Zoom**: 125% untuk better readability

### Layout
- **Split-screen Design**: Hero content di kiri, form + FAQ di kanan
- **No Scroll**: Semua konten fit dalam 1 viewport
- **Responsive Grid**: 2 columns di desktop, single column di mobile
- **Minimal Padding**: Optimized spacing untuk maximize content area

### Animations
- **Typed.js Headlines**: Rotating text dengan efek typing
  - "yang Menyenangkan"
  - "yang Menguntungkan"
  - "yang Simpel"
  - "yang Bernilai"
  - "yang Seru"

## 🛠️ API Endpoints

### POST `/api/pre-register`
Mendaftarkan email ke waiting list

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response Success (200):**
```json
{
  "ok": true,
  "msg": "Check your email to confirm."
}
```

**Response Error:**
- `400` - Email invalid atau sudah terdaftar
- `429` - Rate limit exceeded
- `500` - Server error

### GET `/confirm?token=xxx`
Konfirmasi email registration

**Query Parameters:**
- `token` (required) - Confirmation token dari email

**Response:**
- Redirect ke homepage dengan success message
- Error message jika token invalid

### GET `/api/admin/waitlist`
View semua registered emails (Admin only - add authentication in production!)

**Response:**
```json
[
  {
    "email": "user@example.com",
    "created_at": "2025-10-13 12:00:00",
    "confirmed": 1
  }
]
```

## 🔧 Development

### Hot Reload

Project ini sudah dilengkapi dengan hot reload untuk development yang lebih cepat:

- **Frontend (HTML/CSS/JS)**: Auto-reload browser dalam ~100ms
- **Backend (server.js)**: Auto-restart server dalam ~1 detik

Lihat [HOT_RELOAD.md](HOT_RELOAD.md) untuk detail lengkap.

### Database

SQLite database otomatis dibuat di `data.sqlite` dengan schema:

```sql
CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed INTEGER DEFAULT 0,
  token TEXT
);
```

### Email Testing (Development)

Gunakan MailDev untuk testing email tanpa mengirim email sungguhan:

```bash
# Via Docker Compose (sudah included)
docker-compose up -d

# Atau install standalone
npm install -g maildev
maildev
```

Akses MailDev UI di `http://localhost:1080`

## 📊 Tech Stack

### Backend
- **Node.js** v20+ - Runtime environment
- **Express** ^4.19.2 - Web framework
- **SQLite3** ^5.1.7 - Database driver
- **sqlite** ^5.1.1 - Promise-based SQLite wrapper
- **Nodemailer** ^6.9.14 - Email sending
- **Validator** ^13.12.0 - Email validation
- **express-rate-limit** ^7.3.1 - API rate limiting
- **dotenv** ^16.4.5 - Environment variables

### Frontend
- **Tailwind CSS** (CDN) - Utility-first CSS framework
- **Typed.js** ^2.1.0 - Typing animation
- **Nunito Sans** (Google Fonts) - Typography
- **Vanilla JavaScript** - No framework overhead

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **nodemon** ^3.1.10 - Auto-restart server
- **livereload** ^0.10.3 - Browser auto-reload
- **connect-livereload** ^0.6.1 - Livereload middleware

## 🔒 Security

- ✅ Email validation dengan library `validator`
- ✅ Rate limiting (10 requests per 15 menit per IP)
- ✅ Secure random token generation dengan `crypto`
- ✅ SQL injection protection dengan prepared statements
- ✅ Environment variables untuk sensitive data
- ⚠️ **TODO**: Add admin authentication untuk `/api/admin/waitlist`
- ⚠️ **TODO**: Add CORS configuration untuk production
- ⚠️ **TODO**: Add HTTPS/SSL untuk production deployment

## 🚀 Production Deployment

### Environment Variables

Pastikan set environment variables berikut:

```env
NODE_ENV=production
PORT=3000
BASE_URL=https://yourdomain.com

# Production SMTP (contoh: Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Recommendations

1. **Use HTTPS**: Setup SSL certificate (Let's Encrypt)
2. **Reverse Proxy**: Nginx atau Apache di depan Node.js
3. **Process Manager**: PM2 untuk auto-restart dan monitoring
4. **Database Backup**: Regular backup untuk `data.sqlite`
5. **Monitoring**: Setup logging dan error tracking
6. **CDN**: Serve static assets via CDN

### PM2 Example

```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start server.js --name eluna-teaser

# View logs
pm2 logs eluna-teaser

# Auto-restart on reboot
pm2 startup
pm2 save
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server dengan hot reload |
| `npm start` | Start production server |
| `docker-compose up` | Run dengan Docker (includes MailDev) |
| `docker-compose down` | Stop Docker containers |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is private and proprietary to Eluna.ID.

## 👥 Team

**Eluna.ID Team**
- Website: [eluna.id](https://eluna.id)
- Email: hello@eluna.id

## 🎯 Roadmap

- [x] Pre-registration system
- [x] Email confirmation
- [x] Hot reload development
- [x] Docker containerization
- [x] Modern UI with Typed.js animation
- [x] Split-screen responsive layout
- [ ] Admin dashboard untuk manage waitlist
- [ ] Analytics dan tracking
- [ ] Social media integration
- [ ] Referral system
- [ ] SMS notification (optional)
- [ ] Multi-language support

## 📞 Support

Butuh bantuan? 
- 📧 Email: hello@eluna.id
- 💬 Issues: [GitHub Issues](https://github.com/ariefandriyan/eluna-landing-teaser/issues)

---

**Made with ♥ in Indonesia** 🇮🇩

© 2025 Eluna.ID • Every Experience Matters
