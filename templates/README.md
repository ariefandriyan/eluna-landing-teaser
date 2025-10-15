# Email Templates - Eluna.ID

Folder ini berisi template HTML untuk email dan halaman konfirmasi yang mudah diedit.

## 📁 File Templates

### 1. `email-confirmation.html`
Template untuk email konfirmasi yang dikirim ke user setelah registrasi.

**Placeholder yang bisa diedit:**
- `{{CONFIRM_URL}}` - URL konfirmasi yang otomatis diisi

**Yang bisa diedit:**
- Teks greeting dan pesan
- Warna dan styling CSS
- Benefit list
- Footer content

### 2. `thank-you.html`
Halaman yang ditampilkan setelah user berhasil konfirmasi email.

**Placeholder yang bisa diedit:**
- `{{USER_EMAIL}}` - Email user yang otomatis diisi

**Yang bisa diedit:**
- Pesan selamat
- Benefit cards
- Animasi dan styling
- Background pattern
- Countdown section

### 3. `error.html`
Halaman error yang ditampilkan jika terjadi kesalahan saat konfirmasi.

**Placeholder yang bisa diedit:**
- `{{ERROR_MESSAGE}}` - Pesan error yang otomatis diisi

**Yang bisa diedit:**
- Pesan error umum
- Styling dan warna
- Support information

## 🎨 Cara Edit Template

1. **Edit langsung file HTML** - Buka file di VS Code dan edit sesuai kebutuhan
2. **Live reload** - Perubahan akan terlihat langsung saat server dijalankan
3. **CSS inline** - Semua styling ada di dalam file untuk kompatibilitas email
4. **Responsive design** - Template sudah responsive untuk mobile dan desktop

## 🔧 Hot Reload

Saat development mode (`npm run dev`), perubahan pada template akan langsung terlihat tanpa restart server.

## ⚠️ Tips Editing

- **Email template**: Gunakan CSS inline untuk kompatibilitas email client
- **Web pages**: Bisa gunakan CSS modern dan animasi
- **Placeholder**: Jangan ubah teks dalam `{{}}` karena itu akan diisi otomatis
- **Testing**: Test email dengan MailDev di http://localhost:1080

## 🎯 Variabel Environment

Template menggunakan beberapa variabel yang bisa diatur di `.env`:
- `MAIL_FROM` - Pengirim email
- `PUBLIC_URL` - URL dasar untuk konfirmasi link

---

*Made with 🩵 and ☕️ • Eluna.ID Team*