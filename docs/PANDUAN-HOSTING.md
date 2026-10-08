# Memasang Ghifar Food di hosting sendiri

## 1. Periksa layanan hosting

Pastikan layanan mendukung proses Node.js 24.x yang berjalan terus, folder data persisten, konfigurasi domain/HTTPS, dan akses instalasi dependency. Hosting WordPress/PHP biasa tidak otomatis memenuhi kebutuhan ini. Paket tidak memakai MySQL; jalur server mandiri memakai SQLite dan disk lokal. Bila layanan hanya menyediakan filesystem sementara atau beberapa instance aplikasi, gunakan jalur Cloudflare D1/R2 atau ubah backend sesuai arsitektur layanan itu.

Pemasangan ini belum dilakukan pada akun hosting Anda. Contoh domain `kasir.domainanda.com` harus diganti dengan domain Anda. Semua path API saat ini berbasis root `/`, sehingga gunakan domain/subdomain khusus, bukan subfolder seperti `/ghifar/`.

## 2. Instalasi Node.js langsung

Clone repository atau ekstrak ZIP ke folder aplikasi. Jalankan:

```bash
npm ci
npm run build
cp .env.example .env
```

Edit `.env` untuk VPS dengan Nginx lokal:

```dotenv
APP_URL=https://kasir.domainanda.com
HOST=127.0.0.1
PORT=3000
DATA_DIR=./data
TRUST_PROXY=1
GOOGLE_CLIENT_ID=
```

`APP_URL` adalah origin lengkap tanpa subpath. `GOOGLE_CLIENT_ID` boleh kosong. `TRUST_PROXY=1` hanya dipakai jika Nginx berjalan pada mesin yang sama dan port Node tidak dapat diakses publik; adapter hanya menerima IP dari proxy loopback. Untuk uji lokal biarkan nilai contoh dan buka `http://localhost:3000`. HTTP pada IP/domain publik ditolak sebagai origin konfigurasi agar cookie Secure tidak gagal diam-diam.

```bash
npm start
```

Cek `http://127.0.0.1:3000/healthz`; respons `{"ok":true}` berarti proses aktif. Untuk hosting yang memakai panel aplikasi Node.js, startup file ialah `hosting/server.mjs`, root ialah folder yang berisi package.json, build command ialah `npm ci && npm run build`. Pasang environment variable dari panel; startup yang menjalankan `node hosting/server.mjs` langsung tidak memuat `.env` otomatis. Sesuaikan `HOST`/`PORT` dengan ketentuan panel. Gunakan disk persisten untuk `DATA_DIR`.

## 3. Domain HTTPS dan proses persisten

DNS subdomain diarahkan ke server Anda. Pasang sertifikat SSL pada Nginx melalui prosedur penyedia hosting, lalu gunakan `deploy/nginx.example.conf` sebagai contoh reverse proxy ke port 3000. Sertifikat pada path contoh harus tersedia sebelum konfigurasi diaktifkan. Nginx harus meneruskan seluruh path, termasuk `/api/`, service worker, CSS, JS dan foto. Jangan menggunakan file statis langsung untuk menangani API.

Untuk VPS Linux, `deploy/ghifar-food.service.example` menyediakan contoh unit systemd. Buat user layanan `ghifar`, pasang source di `/opt/ghifar-food`, isi `.env`, dan pastikan user tersebut dapat menulis `data/`. Ganti path `/usr/bin/node` dengan path instalasi Node.js Anda bila berbeda. Setelah menyalin unit ke `/etc/systemd/system/ghifar-food.service`, jalankan:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now ghifar-food
sudo systemctl status ghifar-food
```

Untuk membaca log: `sudo journalctl -u ghifar-food -n 100`. Jalankan satu instance/worker Node untuk satu direktori SQLite. Tidak perlu membuka port 3000 ke internet jika menggunakan proxy lokal.

## 4. Alternatif Docker

Di VPS yang menyediakan Docker Compose, buat `.env` berisi `APP_URL=https://kasir.domainanda.com`, lalu:

```bash
docker compose up -d --build
docker compose logs --tail=100 ghifar
```

Container memakai Node.js 24 dan user non-root. Volume bernama `ghifar-data` menyimpan SQLite, foto dan backup secara persisten; jangan menghapusnya ketika update. Port container dipublikasikan pada `127.0.0.1:3000`, sehingga tetap membutuhkan reverse proxy HTTPS pada VPS. `docker compose down` mempertahankan volume; `docker compose down -v` menghapus data dan bukan prosedur update.

Konfigurasi Compose memakai `APP_URL` dan `GOOGLE_CLIENT_ID` dari `.env`. Default `TRUST_PROXY=0` pada jalur Docker tidak mempercayai header IP proxy; rate limit mengikuti alamat peer container. Untuk banyak pengguna, konfigurasi proxy/IP yang lebih spesifik perlu ditinjau sesuai jaringan Docker Anda.

## 5. Alternatif akun Cloudflare sendiri

Jalur ini tetap memakai Worker + D1 + R2. Dari source:

```bash
npm ci
npx wrangler login
npx wrangler d1 create ghifar-food-db
npx wrangler r2 bucket create ghifar-food-storage
cp wrangler.example.toml wrangler.toml
```

Salin `database_id` hasil perintah ke `wrangler.toml`. Database memakai binding `DB`, penyimpanan memakai binding `BUCKET`. Nama database dan bucket harus sesuai yang Anda buat. Kemudian:

```bash
npx wrangler d1 migrations apply ghifar-food-db --remote
npx wrangler deploy
```

Perintah deploy menjalankan build sesuai konfigurasi. Entry point `hosting/cloudflare.mjs` membuang header identitas Sites yang berasal dari pengunjung, lalu meneruskan request ke worker aplikasi. Gunakan akun email untuk login. `.openai/hosting.json` milik Site asal tidak diperlukan dan tidak disertakan. Tambahkan custom domain pada Worker melalui pengaturan akun Cloudflare Anda. Ikuti permintaan konfirmasi Wrangler karena perintah `--remote` mengubah database akun tujuan.

R2 harus tersedia untuk upload foto dan backup. Google opsional dapat diisi dari menu Akun & keamanan pada aplikasi. Detail binding dapat dibaca pada dokumentasi resmi: https://developers.cloudflare.com/workers/wrangler/configuration/ dan https://developers.cloudflare.com/d1/worker-api/prepared-statements/ .

## 6. Membuat akun dan memeriksa aplikasi

1. Buka domain HTTPS. Pilih Daftar akun, isi email dan password minimal 12 karakter.
2. Simpan kode pemulihan. Anda menjadi Owner ruang kerja baru.
3. Periksa profil, cabang, menu, bahan, resep dan data contoh. Menyembunyikan penanda contoh tidak menghapus datanya.
4. Upload logo/foto untuk memastikan penyimpanan objek bekerja.
5. Buka shift, buat pesanan uji, catat pembayaran, proses dapur, tandai selesai, lalu cocokkan Detail dan laporan laba-rugi.
6. Coba export Excel, backup JSON, login ulang, undangan staf dan pembatasan role. Tes cetak pada printer yang sebenarnya.
7. Login Google membutuhkan Client ID OAuth dan origin domain yang benar; email tetap dapat dipakai tanpa Google. Midtrans tetap ditunda; QRIS manual harus dikonfirmasi staf.

## 7. Update dan backup server

Backup lengkap server mandiri mencakup **seluruh `DATA_DIR`**: SQLite, WAL/SHM bila ada, dan folder objects. Hentikan proses dahulu untuk salinan filesystem yang konsisten, salin direktori ke tempat lain, lalu mulai kembali. Backup JSON dari aplikasi tidak membawa hash password, sesi/PIN atau seluruh file foto.

Untuk update, backup data, ambil source baru, jalankan `npm ci` dan `npm run build`, lalu restart layanan. Migrasi baru diterapkan otomatis ketika server mulai; file migrasi lama tidak boleh diedit. Jangan menghapus folder data saat mengekstrak versi baru. Pengubahan migrasi yang telah diterapkan akan membuat server berhenti dengan pesan kesalahan.

## 8. Jika ada masalah

| Gejala | Pemeriksaan |
| --- | --- |
| npm/start gagal | Node.js harus 24.x; cek dependency, root folder, dan log |
| Login kembali ke demo | HTTPS dan APP_URL harus sama dengan domain browser; periksa cookie |
| API 403 Origin | APP_URL belum sesuai origin domain, atau browser berasal dari domain lain |
| Data hilang setelah deploy | DATA_DIR/volume tidak persisten atau pointing ke folder berbeda |
| Upload foto gagal | Izin tulis folder objects atau binding R2; maksimal 2 MB |
| Frontend tampil tetapi API 404 | Hanya folder dist yang dihosting; gunakan server/API lengkap |
| Restore JSON tidak membawa foto | Ikuti PINDAH-DATA.md; byte foto berada di penyimpanan server lama |

Adapter Node.js memakai `DatabaseSync` dari `node:sqlite` dan diuji pada Node.js 24. SQLite bawaan Node.js 24 masih diberi status eksperimental oleh runtime; periksa dukungan modul itu pada layanan hosting. Referensi API: https://nodejs.org/api/sqlite.html .
