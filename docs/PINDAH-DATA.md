# Memindahkan data restoran dari aplikasi lama

ZIP source tidak mengambil data cloud aktif. Sesudah hosting baru hidup, aplikasi membuat akun/ruang kerja baru. Untuk memindahkan profil dan transaksi:

1. Di aplikasi lama, masuk sebagai Owner dan pilih Backup & cloud → Unduh backup JSON. Simpan sebelum berpindah.
2. Di domain baru, daftar akun Owner baru. Simpan kode pemulihan akun baru.
3. Pilih Backup & cloud → Pulihkan backup, pilih JSON lama, dan baca konfirmasi penggantian data ruang kerja.
4. Cocokkan cabang, menu, bahan, pesanan, payroll dan snapshot laporan. Gunakan kode undangan baru agar staf menerima akses pada server baru.

Pemulihan mengikuti batas periode tertutup dan pembayaran yang telah dikunci. Jika aplikasi menolak restore karena kondisi ruang kerja tujuan berbenturan dengan data lama, jangan menghapus penguncian melalui database; periksa data tujuan dan alur restore dengan pengelola source. Ruang kerja baru masih mengandung contoh, sehingga bandingkan secara eksplisit sebelum menyetujui pemulihan.

## Foto dan logo

Backup JSON menyimpan URL foto/logo, bukan byte file di R2. URL lama dapat mengarah ke `/api/photo?workspace=...` pada ruang kerja server sebelumnya dan tidak otomatis berlaku di server baru. Simpan foto asli sebelum pindah, lalu upload ulang logo dan foto menu melalui pengaturan dan Menu & Harga pada domain baru. Foto bawaan yang memakai tautan eksternal tetap membutuhkan sumber eksternal tersebut.

## Akun dan keamanan

Backup restoran tidak memindahkan tabel akun, password, session, keanggotaan atau hash PIN manager. Buat akun dan undangan baru, atur PIN, serta Client ID Google untuk origin domain baru. Jika akun email telah ditautkan di Site lama, login tersebut tetap milik database lama sampai data akun dimigrasi secara administratif; restore JSON bukan migrasi akun.

## Jika hanya memindahkan VPS mandiri

Jika asal dan tujuan sama-sama memakai adapter Node.js paket ini, gunakan backup **seluruh DATA_DIR** ketika proses berhenti, bukan hanya JSON restoran. Salin SQLite beserta folder objects, gunakan source yang kompatibel, beri izin tulis user layanan, atur APP_URL baru dan mulai aplikasi. Jalur ini membawa akun dan foto yang disimpan pada server mandiri. Jangan memasukkan direktori data ke GitHub.

## Pemeriksaan sebelum berpindah operasional

Bandingkan beberapa transaksi beserta HPP, nilai stok, piutang/hutang, absensi/payroll, foto dan akses staf. Selesaikan antrean offline di perangkat lama; antrean dan cache browser lama tidak otomatis berpindah ke domain baru. Setelah data cocok, arahkan perangkat restoran dan QR pelanggan ke domain baru. Hindari mencatat transaksi operasional yang sama di dua server bersamaan selama perpindahan.
