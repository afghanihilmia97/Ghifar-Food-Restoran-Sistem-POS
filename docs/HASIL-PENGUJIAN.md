# Hasil pemeriksaan paket ekspor

Diperiksa 8 Oktober 2026 pada Node.js v24.19.0.

- Instalasi dependency bersih menggunakan npm ci: lulus.
- npm run build: lulus.
- npm test: 579 pemeriksaan aplikasi lulus.
- npm run test:hosting: 31 pemeriksaan adapter dan server HTTP lulus.
- Login email, cookie, penolakan header identitas palsu, konflik revisi, transaksi SQLite, upload foto, backup dan data setelah restart: lulus.
- Backend menggunakan source versi 17, dengan adapter hosting tambahan.
- Aplikasi Sites asal tidak diubah atau diterbitkan ulang.

Docker image, Nginx, GitHub Actions, Google OAuth live, printer fisik dan deploy Cloudflare belum dijalankan pada akun/hosting tujuan. Panduan menyediakan konfigurasi dan langkahnya; hasil uji lokal tidak berarti server tujuan sudah terpasang.
