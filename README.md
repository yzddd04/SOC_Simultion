# Tutorial Simulasi Lab Keamanan Web (Vulnerable App)

Projek ini adalah aplikasi web yang sengaja dibuat rentan untuk tujuan edukatif. Aplikasi ini mensimulasikan beberapa celah keamanan umum yang sering ditemukan di OWASP Top 10.

## Cara Menjalankan

1. Pastikan Node.js sudah terinstal.
2. Jalankan perintah: `node server.js`
3. Buka browser di: `http://localhost:3000`

---

## Panduan Eksploitasi

### 1. SQL Injection (SQLi)

**Deskripsi:** Penyerang menyisipkan perintah SQL ke dalam input form untuk memanipulasi database.
**Cara Retas:**

- Masukkan `' OR '1'='1` ke dalam kotak pencarian username.
- **Hasil:** Query akan menjadi `SELECT * FROM users WHERE username = '' OR '1'='1'`. Karena `'1'='1'` selalu benar, server akan mengembalikan semua data user, termasuk data `admin`.

### 2. Server-Side Request Forgery (SSRF)

**Deskripsi:** Server dipaksa untuk melakukan request ke URL internal atau eksternal yang tidak seharusnya bisa diakses publik.
**Cara Retas:**

- Masukkan `http://localhost:3000/api/admin-secret` ke dalam input SSRF.
- **Hasil:** Server akan memanggil endpoint internalnya sendiri. Anda akan mendapatkan data rahasia yang hanya bisa dilihat oleh "lokal".
- Anda juga bisa mencoba URL eksternal seperti `http://ifconfig.me` untuk melihat IP publik server.

### 3. Bruteforce Attack

**Deskripsi:** Percobaan menebak password secara terus-menerus karena tidak adanya batasan percobaan login (rate limiting).
**Cara Retas:**

- Di dunia nyata, anda akan menggunakan tool seperti Burp Suite Sniper atau script Python.
- Untuk simulasi ini, coba tebak password user `admin`.
- Petunjuk: Passwordnya adalah `p4ssw0rd123`.

### 4. Stored Cross-Site Scripting (XSS)

**Deskripsi:** Menyisipkan script ke dalam database yang kemudian akan dijalankan di browser pengguna lain.
**Cara Retas:**

- Masukkan script berikut ke dalam kotak pesan: `<script>alert('Akun anda telah diretas!')</script>`
- **Hasil:** Setiap kali halaman dimuat, script tersebut akan berjalan otomatis.

### 5. Local File Inclusion (LFI) / Directory Traversal

**Deskripsi:** Membaca file penting di dalam server dengan memanipulasi path file.
**Cara Retas:**

- Masukkan `package.json` atau `server.js` ke dalam input "Baca File".
- **Hasil:** Isi file sensitif akan ditampilkan di layar.

---

## Monitoring Dashboard (SOC)

Dashboard SOC (Security Operations Center) digunakan untuk memantau serangan secara real-time.

### Cara Menjalankan SOC:

1. Pastikan server simulasi (Port 3000) sudah berjalan.
2. Masuk ke folder `siem` dan jalankan: `node server.js`
3. Buka browser di: `http://localhost:4000`

### Apa yang dilakukan SOC ini?

- **Deteksi Otomatis**: Mendeteksi pola serangan dari request yang masuk ke server utama.
- **Alert Real-time**: Menampilkan notifikasi "Critical" atau "High" detik itu juga saat serangan terdeteksi.

---

> [!WARNING]
> Gunakan lab ini hanya untuk belajar. Jangan gunakan teknik ini pada situs web yang bukan milik anda tanpa izin resmi!
