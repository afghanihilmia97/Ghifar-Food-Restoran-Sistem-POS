# Ghifar Food — Restaurant OS

Aplikasi restoran dengan login email mandiri, Google opsional, login ChatGPT, database D1, foto serta backup R2. Mode demo tanpa login hanya bertahan selama halaman terbuka. Profil, menu, bahan, meja dan staf awal adalah contoh yang perlu disesuaikan.

## Fitur

Modul dashboard, kasir/pesanan, pelanggan/member/poin, reservasi/meja/daftar tunggu, menu/foto/harga, resep/HPP, inventori/supplier/PO, payroll/cuti/lembur/absensi, promo, laporan Excel/PDF, multi-cabang, hak akses/audit, menu QR pelanggan, profil/logo dan cloud tetap tersedia.

Tambahan: split bill rata/kursi/jumlah item; pembayaran parsial/metode gabungan; pelayan dari HP; tambah/pindah/gabung pesanan; struk 58/80 mm dan tiket dapur; void/refund dengan persetujuan manager; batch/kedaluwarsa/FEFO; invoice/hutang/cicilan supplier; deposit/no-show/refund reservasi; antrean per bagian; jadwal bertanggal/pertukaran shift; pencairan/biaya/selisih pembayaran; katering terjadwal/deposit/produksi/pengiriman; notifikasi operasional; backup versi/restore; analisis menu/jam ramai/member; PWA/offline opsional.

Stok yang belum diberi batch mempunyai tanggal kedaluwarsa yang belum diketahui. FEFO memakai batch valid dahulu, lalu stok belum diberi batch. Batch kedaluwarsa tidak boleh masuk produksi. PO diterima membuat batch dan invoice; pembelian persediaan tidak dihitung ulang sebagai HPP. Deposit kas dicatat sekali, lalu dialokasikan ke tagihan. Kas shift meliputi pembayaran tunai, deposit, refund, pengeluaran dan pembayaran supplier tunai. Laporan penjualan dikurangi refund; HPP makanan yang sudah dibuat tetap menjadi biaya.

## Koneksi eksternal

Midtrans sengaja belum dikonfigurasi. Menu status/pengaturan tersedia; pembuatan pembayaran otomatis mengembalikan GATEWAY_NOT_CONFIGURED dan tidak melunasi pesanan. QRIS manual harus diperiksa staf.

Cetak thermal memakai dialog cetak perangkat. Printer jaringan/Bluetooth otomatis memerlukan konektor dan belum terhubung. WhatsApp memakai tautan konfirmasi pelanggan; koneksi marketplace delivery eksternal belum tersedia.

## Offline dan backup

Offline diaktifkan per akun/perangkat, lalu buka aplikasi sekali saat online. Pesanan baru tunai/belum dibayar dapat diantrekan lokal. ID operasi mencegah pencatatan ganda saat retry. Harga atau total berubah harus ditinjau. Dapur cloud menerima pesanan setelah sinkron. Pembayaran digital, refund, perubahan stok dan perubahan data lain membutuhkan koneksi. Cache privat dipisahkan per akun/ruang kerja dan dihapus saat keluar; antrean harus disinkronkan/dihapus sebelum keluar. Service worker menyimpan aset aplikasi, bukan respons API.

Backup R2 otomatis menyimpan versi sebelum perubahan. Owner dapat mengatur retensi, membuat backup manual dan memulihkan versi. Tidak dibuat versi berkala baru ketika tidak ada aktivitas. Backup JSON tetap tersedia.

## Build dan pengujian

```bash
npm ci
node scripts/build.mjs
node scripts/test.mjs
node scripts/test-restaurant.mjs
node scripts/test-offline.mjs
```

Worker dibundel di dist/server/index.js bersama aset. Schema berada di db/schema.js, migrasi di drizzle; jangan mengubah migrasi yang telah diterapkan. Pengujian mencakup SQLite dengan adapter D1, R2 tiruan, render melalui stub DOM, perhitungan transaksi, cache/outbox dan pembacaan Excel menggunakan openpyxl. Perangkat printer, browser nyata dan Midtrans belum diuji.

## Operasional tambahan (versi 14)

12 modul baru: ketersediaan otomatis per cabang (stok layak dikurangi alokasi pesanan), persiapan harian (resep/batch/hasil aktual/HPP satuan), saran pembelian (minimum/riwayat/katering/PO berjalan), draft PO yang dapat diedit dan dikonfirmasi, retur supplier dengan nota kredit dan batch asal, combo dengan pilihan menu melalui checkbox, invoice piutang/termin/cicilan, layar kedua kasir, tautan status pelanggan, rating/komplain dan riwayat penyelesaian, import Excel/CSV tervalidasi, checklist/serah terima, dan target anggaran per cabang/bulan.

Resep yang belum lengkap ditandai; ketersediaan otomatis membutuhkan resep. Harga dan komposisi disimpan di baris pesanan. Combo memakai harga paket dan kebutuhan bahan pilihan. Penghitungan bahan gabungan mencegah satu bahan dijual dua kali untuk beberapa pilihan kelompok. Stok baru tetap diperiksa di server; catering terjadwal dapat direncanakan sebelum bahan tersedia, tetapi produksi harus memenuhi stok layak.

Persiapan bahan menghasilkan inventori dan batch, tidak menghasilkan biaya operasional kedua. Retur hanya menerima batch penerimaan asal yang belum dipakai, dengan kredit maksimal hutang terbuka. Pengembalian dana untuk supplier yang telah dibayar penuh belum dicatat lewat modul retur. Piutang terhubung dengan pembayaran pesanan; invoice tidak menambah omzet kedua. Termin berjumlah sama dengan saldo ketika invoice dibuat. Pesanan baru masuk laba-rugi saat lunas dan selesai sesuai rumus yang ada.

Tracking menggunakan token acak per pesanan; proyeksi publik hanya berisi nomor, status, ringkasan item, total, dan status pembayaran. Token tidak berubah saat pesanan online diterima. Ulasan pelanggan tersedia setelah selesai, satu per pesanan. Status pelacakan diperiksa tiap 5 detik; katalog online tiap 10 detik. Layar pelanggan cloud memerlukan akun kasir/manager/owner yang sama; keranjang berjalan dibagikan antar tab pada browser yang sama melalui BroadcastChannel, sedangkan perangkat lain menerima pesanan yang sudah disimpan lewat polling. Demo tanpa login tidak menghasilkan tautan lintas perangkat yang persisten.

Import menerima XLSX/XLS/CSV hingga 500 baris dan 2 MB, memvalidasi seluruh file sebelum melakukan perubahan, dan menolak duplikat nama/email/telepon serta data angka/cabang/jam yang salah. Checklist yang sudah diserahterimakan terkunci. Target realisasi memakai penjualan bersih, HPP dan biaya sesuai laporan yang ada. Pengaturan tetap tepat di atas Offline & perangkat. Midtrans tetap belum dikonfigurasi.

Tambahan pengujian:
```bash
node scripts/test-growth.mjs
node scripts/test-growth-ui.mjs
```

Pengujian DOM/formulir menggunakan jsdom. Worker dan database diuji melalui SQLite/R2 tiruan. Tampilan browser nyata, layar fisik kedua dan printer belum diuji dalam lingkungan ini.


## Akun dan kontrol operasional (versi 15)

Akun email dapat dibuat tanpa ChatGPT. Owner yang masih masuk dengan ChatGPT bisa memilih “hubungkan ke restoran yang sedang dibuka” agar data ruang kerja lama tetap tersedia. Akses staf mandiri memakai kode undangan 48 jam, terikat email dan role, sekali pakai. Owner dapat mencabut anggota dari Akun & keamanan. Daftar karyawan tetap terpisah dari pemberian akses login.

Password 12–128 karakter, hash WebCrypto PBKDF2 SHA256 berantai enam putaran × 100.000 iterasi, salt acak; cookie sesi HttpOnly/Secure/SameSite Lax; token sesi hanya disimpan dalam bentuk hash. Login, PIN dan pemulihan dibatasi. Kode pemulihan acak ditampilkan sekali; reset mengganti kode dan mencabut semua sesi. Belum ada pengiriman email verifikasi atau pemulihan otomatis. Email akun lokal tidak otomatis mendapat keanggotaan ChatGPT berdasarkan kecocokan alamat.

Login Google memakai GSI, pemeriksaan signature/JWKS resmi, issuer, audience, waktu dan email_verified, serta nonce sekali pakai. Owner memasang Google Client ID pada Akun & keamanan atau melalui GOOGLE_CLIENT_ID. Origin situs harus terdaftar di Google OAuth; sebelum konfigurasi, aplikasi menampilkan status belum tersedia. Akun email yang telah terdaftar tidak ditautkan otomatis oleh Google. Pengujian JWT menggunakan kunci RSA tiruan; integrasi akun Google nyata belum diuji karena Client ID belum disediakan.

Pembayaran payroll dikonfirmasi dengan bukti dan tanggal; langsung menghasilkan satu pengeluaran Gaji. Tunai harus terhubung shift terbuka. Draft tidak memengaruhi laba; payroll dibayar dan pengeluaran terkait terkunci. Biaya servis dan biaya kanal juga diposting sekali dan tidak dapat dihapus lewat edit umum; koreksi dicatat terpisah.

Opname menyimpan stok sistem/fisik, aktor, alasan dan urutan mutasi. Dua opname memungkinkan perbandingan penjualan teoretis versus pemakaian aktual, memperhitungkan penerimaan/transfer/persiapan/waste dan pembatalan. Opname pertama hanya selisih stok fisik terhadap sistem. Konversi kemasan seperti karung ditetapkan per bahan, bersama kg/gram dan liter/ml. Pembelian dan resep disimpan dalam satuan dasar; satuan dasar yang sudah memiliki stok/resep tidak bisa diganti langsung.

PIN manager melindungi diskon khusus, harga dasar/kanal dan koreksi stok. Server memeriksa jalur perintah, edit umum, dan restore yang mengubah harga/stok. PIN hash berada di tabel keamanan terpisah, bukan data restoran/backup. Persetujuan menyimpan pelaku, alasan dan metode persetujuan; PIN bersama tidak mengidentifikasi manager individu. Tanpa PIN aktif, aksi sensitif hanya untuk owner/manager.

Dine in, Takeaway, Online, Delivery dan Katering memiliki harga menu dan biaya kanal. Harga serta kebijakan biaya disnapshot pada pesanan. Komisi berbasis penjualan setelah diskon tanpa pajak/layanan; kemasan dan biaya tetap per pesanan. Biaya masuk laporan setelah selesai dan lunas. Refund komisi dari platform dicatat sebagai koreksi biaya manual. Saran produksi memakai hari sejenis dalam 7–180 hari dan katering terjadwal, termasuk komponen combo; bahan persiapan dibandingkan dengan stok layak. Ini saran memakai resep standar, bukan ramalan pasti untuk varian/topping. Rencana porsi bisa ditinjau, disimpan dan ditandai selesai; produksi bahan dicatat tersendiri.

Strategi menu mengelompokkan transaksi selesai/lunas menjadi Bintang, Laris margin kecil, Untung kurang laris, dan Perlu evaluasi. Batas popularitas 70% rata-rata porsi per menu terjual; batas kontribusi rata-rata tertimbang hanya dari modal lengkap. Menu tanpa modal ditandai. Komisi kanal dibaca terpisah di laporan, bukan dianggap biaya bahan.

Aset menyimpan nilai pembelian, nomor seri, kondisi, penanggung jawab dan jadwal servis; jadwal jatuh tempo menjadi notifikasi. Penyusutan aset belum otomatis. Servis diselesaikan dengan biaya aktual dan bukti pembayaran.

Penutupan bulanan per cabang menyimpan snapshot penjualan/HPP/biaya/laba dan mengunci pesanan, pembayaran, refund, mutasi serta pengeluaran pada bulan tersebut, termasuk perubahan tanggal/cabang. Buka kembali khusus Owner, dengan alasan dan PIN jika aktif. Koreksi biaya bertaut laporan asal pada bulan terbuka. Restore tidak boleh diam-diam membuka laporan atau menghapus pembayaran yang telah dikonfirmasi. Penutupan bulan berjalan juga mengunci transaksi baru sampai dibuka kembali.

Navigasi dikelompokkan dan favorit disimpan per akun/ruang kerja pada perangkat. Pengaturan tetap tepat di atas Offline & perangkat. Jalankan `npm run build` lalu `npm test`; pengujian mencakup domain transaksi, API SQLite/R2, keamanan akun/JWT tiruan, formulir jsdom, Excel dan cache offline. Browser nyata, Google live dan printer fisik belum diuji di lingkungan ini.


## Kelola kategori (versi 16)

Menu & Harga dan kolom kategori pada Tambah/Edit menu memiliki tombol Kelola kategori. Owner/Manager dapat menambah, mengganti nama dan menghapus kategori. Nama duplikat ditolak. Rename memperbarui kategori menu terkait; menghapus kategori yang dipakai memerlukan pengganti dan memindahkan menu tanpa menghapusnya. Isian serta input foto pada draft menu dipertahankan ketika pengelola kategori dibuka. Kategori disimpan dalam data ruang kerja D1, ID kategori lama tetap stabil, dan kategori custom dari import turut dikenali.


## Layout Pesanan Baru (versi 17)

Kasir menggunakan dialog luas dengan ringkasan pesanan di kiri dan katalog foto menu di kanan. Pencarian, kategori dengan jumlah menu, kartu tambah menu untuk Owner/Manager, pengaturan pelanggan, meja/cabang, kanal, promo dan metode pembayaran terhubung data restoran. Keranjang mempertahankan varian, topping, combo dan catatan; jumlah dan kanal memperbarui harga, pajak, layanan dan total. Menu yang kekurangan bahan tetap tidak dapat dipesan. Tambah menu langsung dari kasir mempertahankan draft transaksi, termasuk pelanggan dan jumlah item. Di layar kecil katalog dan ringkasan ditumpuk agar tetap dapat digunakan.

Pengujian alur kasir menggunakan jsdom mencakup foto, pencarian/filter, varian/topping, perhitungan total, harga kanal, tambah menu tanpa kehilangan draft, meja per cabang, input tunai, simpan pesanan dan tambahan item. Tampilan browser nyata belum diuji dalam lingkungan ini.
