# 🔄 Hot Reload Configuration

## Fitur yang Ditambahkan

Aplikasi sekarang dilengkapi dengan **hot reload** untuk mempercepat development dengan reload otomatis saat ada perubahan file.

## Cara Kerja

### 1. **LiveReload untuk Frontend (HTML/CSS/JS)**
- Menggunakan `livereload` dan `connect-livereload`
- Secara otomatis me-reload browser saat ada perubahan di folder `public/`
- Mendukung file: HTML, CSS, JS, dan gambar (PNG, JPG, SVG, dll)
- Delay: 100ms untuk menghindari reload berulang

### 2. **Nodemon untuk Backend (Server.js)**
- Menggunakan `nodemon` untuk auto-restart server
- Memantau perubahan di: `server.js` dan `.env`
- Delay: 1000ms untuk stabilitas
- Tidak memantau: `node_modules/`, `data.sqlite`, `public/`

## Cara Penggunaan

### Development Mode (dengan Hot Reload)
```bash
npm run dev
```

### Production Mode (tanpa Hot Reload)
```bash
npm start
```

## Yang Terjadi Saat Development:

1. **Perubahan di `public/` folder** (HTML, CSS, JS, gambar):
   - ✅ Browser otomatis reload dalam ~100ms
   - ❌ Server tidak restart

2. **Perubahan di `server.js` atau `.env`**:
   - ✅ Server otomatis restart dalam ~1 detik
   - ✅ Browser tetap terhubung (refresh manual jika perlu)

3. **Perubahan di `data.sqlite`**:
   - ❌ Tidak trigger reload (database file diabaikan)

## Output Terminal

Saat menjalankan `npm run dev`, Anda akan melihat:

```
[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): server.js .env
[nodemon] watching extensions: js,json
[nodemon] starting `node server.js`
🔄 Live reload enabled - watching public folder
Eluna.ID teaser running on http://localhost:3000
```

## Tips

- **Manual restart**: Ketik `rs` di terminal dan tekan Enter
- **Stop server**: Tekan `Ctrl + C`
- **Clear console**: Nodemon akan clear console setiap restart (bisa dikonfigurasi)

## Dependencies Baru

```json
{
  "devDependencies": {
    "nodemon": "^3.1.10",
    "livereload": "^0.9.3",
    "connect-livereload": "^0.6.1"
  }
}
```

## Troubleshooting

### Browser tidak auto-reload?
1. Pastikan server berjalan dengan `npm run dev`
2. Periksa console browser untuk error
3. Coba hard refresh (Cmd+Shift+R di Mac, Ctrl+Shift+R di Windows)

### Server tidak auto-restart?
1. Periksa file `nodemon.json` untuk konfigurasi
2. Pastikan file yang diubah ada dalam daftar `watch`
3. Coba manual restart dengan mengetik `rs` di terminal

### Port 3000 sudah digunakan?
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Atau gunakan port lain di .env
PORT=3001 npm run dev
```

---

**Happy coding! 🎉**
