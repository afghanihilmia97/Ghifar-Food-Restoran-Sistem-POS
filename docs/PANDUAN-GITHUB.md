# Upload Ghifar Food ke GitHub

## Cara tanpa terminal

1. Ekstrak ZIP. Buka folder `ghifar-food` sampai terlihat `package.json`, `README.md`, `dist`, `worker`, `src` dan `hosting`.
2. Di akun GitHub Anda, buat repository baru, misalnya `ghifar-food`. Pilih Private jika source hanya untuk Anda. Karena paket sudah mempunyai README, tidak perlu membuat README tambahan saat membuat repository.
3. Pilih **uploading an existing file** atau **Add file → Upload files** pada repository.
4. Tarik isi folder `ghifar-food` ke area upload. Upload file/folder hasil ekstrak, bukan ZIP-nya saja. Pastikan `package.json` berada di root repository, bukan di dalam folder tambahan.
5. Periksa file yang masuk, beri pesan commit `Upload source Ghifar Food`, lalu Commit changes.
6. File tersembunyi seperti `.gitignore`, `.env.example`, `.dockerignore` dan `.github/workflows/ci.yml` kadang tidak ikut drag-and-drop. Tambahkan melalui Add file → Create new file dengan nama/path yang sama jika diperlukan.

Untuk upload seluruh folder sekaligus, GitHub Desktop lebih praktis: File → Add local repository, pilih folder hasil ekstrak, buat repository bila diminta, Commit lalu Publish repository ke akun Anda.

## Cara terminal

Dari folder `ghifar-food`:

```bash
git init
git add .
git commit -m "Upload source Ghifar Food"
git branch -M main
git remote add origin https://github.com/USERNAME/ghifar-food.git
git push -u origin main
```

Ganti `USERNAME` dan nama repository dengan alamat milik Anda. Jalur ini cocok untuk repository baru yang masih kosong. Jika sudah berisi commit, clone repository tersebut dahulu, salin isi paket ke folder hasil clone, lalu commit dan push; jangan menimpa riwayat dengan force push.

## Setelah berhasil

Di halaman repository harus terlihat `README.md`, `package.json`, `package-lock.json`, `dist/`, `src/`, `worker/`, `hosting/` dan `drizzle/`. Hosting mengambil source dari repository ini. GitHub menyimpan source; upload ke GitHub belum menjalankan aplikasi.

Workflow CI opsional sudah tersedia untuk build dan pengujian. CI tidak menerbitkan aplikasi dan tidak memerlukan secret hosting. Dependency, file database dan konfigurasi pribadi tidak perlu di-upload. `.gitignore` mencegahnya ikut melalui Git.
