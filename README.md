# Ghifar Food — source lengkap untuk GitHub dan hosting sendiri

Paket aplikasi Restaurant OS versi 17, diekspor 8 Oktober 2026. Berisi frontend, backend, perhitungan transaksi/laba-rugi, migrasi database, aset, pengujian dan buku panduan. Paket ekspor menambahkan server Node.js dengan SQLite dan penyimpanan foto/backup di disk. Aplikasi yang sudah diterbitkan tetap terpisah dari paket ini.

## Mulai di sini

1. Untuk upload repository, baca [PANDUAN-GITHUB.md](docs/PANDUAN-GITHUB.md).
2. Untuk memasang aplikasi, baca [PANDUAN-HOSTING.md](docs/PANDUAN-HOSTING.md).
3. Untuk memindahkan data, baca [PINDAH-DATA.md](docs/PINDAH-DATA.md).
4. Penggunaan fitur lengkap ada dalam `docs/Buku-Panduan-Ghifar-Food.pdf` dan versi Word di folder yang sama.

## Menjalankan di komputer

Gunakan Node.js **24.x**. Dari folder yang berisi `package.json`:

```bash
npm ci
npm run build
npm start
```

Buka **http://localhost:3000**. Pilih **Daftar akun**, buat akun email dengan password minimal 12 karakter, dan simpan kode pemulihan yang muncul. Data akun disimpan di `data/ghifar.sqlite`; foto dan backup tersimpan di `data/objects/`. Database dibuat dan migrasi SQL diterapkan otomatis saat server pertama kali dijalankan. Jalankan satu proses aplikasi untuk direktori data ini.

Untuk domain publik gunakan HTTPS, isi `APP_URL` dan pasang reverse proxy sebagaimana panduan hosting. Cookie login memakai Secure dan HttpOnly. Membuka file `index.html` langsung atau mengunggah hanya `dist/` ke hosting statis tidak menjalankan backend.

## Pilihan hosting

| Lingkungan | Cara menjalankan |
| --- | --- |
| VPS / hosting Node.js 24 dengan disk persisten | Server `hosting/server.mjs`, SQLite, folder objek lokal |
| VPS dengan Docker | `Dockerfile` dan `compose.yaml`; volume data persisten |
| Akun Cloudflare sendiri | Workers + D1 + R2, contoh konfigurasi Wrangler |
| GitHub Pages / hosting HTML / hosting PHP biasa | Hanya menampilkan frontend; perlu server backend terpisah atau layanan Node.js |

Login email dan undangan staf bekerja tanpa ChatGPT. Login ChatGPT hanya berlaku di lingkungan Sites asal, sehingga tombolnya dihilangkan pada paket ekspor. Login Google memerlukan Client ID dan konfigurasi origin domain Anda. Midtrans tetap belum dikonfigurasi.

## Isi source

| Folder/file | Fungsi |
| --- | --- |
| `dist/index.html`, `dist/*.css`, `dist/enterprise.js`, `dist/*-ui.js` | Source frontend yang dapat diedit langsung |
| `src/` | Logika domain, resep, stok, perhitungan HPP/laba, kategori |
| `worker/` | API, akun, hak akses, operasi transaksi, backup |
| `db/schema.js`, `drizzle/` | Schema dan semua migrasi SQLite/D1 |
| `scripts/build.mjs` | Build aset spreadsheet/QR dan backend dengan esbuild |
| `hosting/` | Adapter database/file dan server hosting mandiri |
| `deploy/` | Contoh Nginx dan systemd |
| `docs/` | Panduan GitHub, hosting, migrasi data, buku penggunaan |

Frontend ini tidak memakai React/Vite. File UI utama memang ada di `dist/`; **jangan hapus seluruh folder dist sebelum build**. File seperti `dist/core.js` disalin dari `src/`, sedangkan `dist/server/index.js`, `dist/qr.js` dan `dist/spreadsheet.js` dihasilkan oleh build. Untuk mengubah logika domain edit `src/`, lalu jalankan build ulang.

## Pengujian

Pengujian lengkap membutuhkan Python 3 dengan `openpyxl` untuk memeriksa ekspor Excel.

```bash
python -m pip install -r requirements-test.txt
npm run build
npm test
npm run test:hosting
```

Pengujian hosting memeriksa login melalui HTTP, penolakan header identitas palsu, penyimpanan data dan foto, backup, transaksi database, konflik revisi, serta keberlanjutan data setelah restart. Integrasi Google nyata, printer fisik, Docker/Nginx dan deploy Cloudflare harus diperiksa di lingkungan tujuan.

## Data dan konfigurasi

Paket ini berisi source dan data contoh bawaan aplikasi, bukan salinan database produksi, akun pengguna, password, cookie, API key atau foto yang tersimpan di server lama. Menyembunyikan penanda data contoh tidak menghapus transaksi contoh. Periksa data awal sebelum penggunaan operasional.

`node_modules`, folder data, `.env`, log dan riwayat `.git` tidak disertakan. Dependency dipasang melalui `npm ci`. Tidak ada API key Midtrans atau Google dalam paket. Jangan memasukkan `.env`, data transaksi atau backup operasional ke repository publik.

Catatan implementasi awal disimpan di [README-VERSI-17.md](docs/README-VERSI-17.md). Buku panduan mengacu pada fitur versi 17; bagian login ChatGPT/D1/R2 menjelaskan lingkungan asal, sedangkan panduan hosting ini menjelaskan paket mandiri.
