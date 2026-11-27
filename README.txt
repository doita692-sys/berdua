LOVE MATE - PANDUAN INSTALASI

A. YANG DIBUTUHKAN
1. Laptop/PC.
2. Visual Studio Code.
3. Internet.
4. Akun Google untuk Firebase.

B. MEMBUKA PROJECT
1. Extract love_mate.zip.
2. Buka VS Code.
3. Klik File > Open Folder.
4. Pilih folder love_mate.
5. Install extension "Live Server" dari Extensions.
6. Klik kanan index.html > Open with Live Server.

C. SETUP FIREBASE
1. Buka https://console.firebase.google.com/
2. Klik Add project, beri nama LOVE MATE.
3. Setelah project jadi, klik ikon Web </> untuk menambahkan aplikasi web.
4. Beri nama aplikasi, misalnya love-mate-web.
5. Salin firebaseConfig yang diberikan.
6. Buka firebase-config.js di VS Code. Ganti semua nilai ISI_... dengan konfigurasi milikmu.
   Database URL harus sesuai URL yang ditampilkan Firebase saat membuat Realtime Database.

D. AKTIFKAN LOGIN ANONIM
1. Firebase Console > Build > Authentication.
2. Klik Get started.
3. Buka Sign-in method.
4. Pilih Anonymous, aktifkan, lalu Save.

E. BUAT REALTIME DATABASE
1. Firebase Console > Build > Realtime Database.
2. Klik Create Database.
3. Pilih lokasi terdekat yang tersedia.
4. Pilih Start in locked mode.
5. Setelah database dibuat, buka tab Rules.
6. Untuk prototipe dua orang, gunakan rules di bawah ini lalu Publish.

{
  "rules": {
    "rooms": {
      "$room": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}

PENTING: Rules di atas hanya cocok untuk demo/praktik. Semua pengguna yang sudah login anonim dapat membaca/menulis data room jika mengetahui kode ruang. Jangan gunakan untuk menyimpan data sensitif atau untuk aplikasi publik. Untuk produksi, buat rules yang memvalidasi anggota room dan UID.

F. CARA PAKAI BERSAMA PASANGAN
1. Jalankan website dari VS Code dengan Live Server.
2. Orang pertama isi nama, lalu klik "Buat ruang berdua".
3. Catat kode 6 karakter yang muncul.
4. Bagikan kode itu ke pasangan.
5. Pasangan membuka website yang sama dari perangkatnya, isi nama, masukkan kode, lalu klik Gabung.
6. Mood, wishlist, kenangan, dan tabungan akan tersinkron melalui Firebase.

G. ONLINE AGAR BISA DIAKSES DARI MANA SAJA
Live Server hanya untuk pengembangan di laptop sendiri.
Untuk membagikan website melalui internet, upload folder project ke layanan hosting seperti Firebase Hosting atau Netlify.
Sebelum deploy, pastikan konfigurasi Firebase sudah benar dan rules database sudah diamankan.

CATATAN FITUR
- Mood pasangan: tersimpan online per pengguna.
- Love Quiz: permainan pertanyaan pilihan ganda di browser.
- Wishlist: tambah dan hapus rencana.
- Memory Lane: simpan cerita dan link foto HTTPS. Foto memakai link publik; belum ada fitur upload foto langsung.
- Tabungan: catat setoran, target, dan total bersama.
- Mesin Bucin: gombalan acak.
