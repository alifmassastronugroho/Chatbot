# Gymmy

Asisten olahraga pribadi berbasis chat

Gymmy adalah asisten olahraga berbasis chat. Pengguna mencari gym di mana saja lewat Google Maps, membandingkan pilihan, dan menyusun jadwal latihan dalam satu percakapan.

Status: prototipe. Chat, pencarian gym lewat Google Maps, dan saran jadwal latihan sudah jalan. Peta di antarmuka, layar Home dan Statistics, serta fitur pola makan masih rencana.

## Masalah yang ingin diselesaikan

Orang yang ingin mulai berolahraga sering berhenti di langkah awal. Mereka tidak tahu gym mana yang dekat, bagaimana menyusun latihan, dan berapa banyak yang harus dimakan. Gymmy menjawab semuanya di satu tempat.

## Target pengguna

1. Pemula yang ingin rutin berolahraga tapi bingung memulai.
2. Mahasiswa dan pekerja dengan waktu terbatas.
3. Orang yang baru pindah ke satu area dan belum tahu gym di sekitarnya.
4. Orang yang ingin mengatur makan dan minum sesuai tujuan kebugarannya.

## Fitur

### Fitur sekarang

1. Antarmuka chat dengan mode terang dan gelap, untuk layar mobile dan desktop.
2. Server Express dengan satu endpoint chat.
3. Pencarian gym lewat Grounding with Google Maps di Gemini API. Pengguna bisa menyebut nama tempat atau area di seluruh dunia. Jawaban memuat alamat, rating, jam buka, dan rute dari Google Maps.
4. Tautan sumber Google Maps untuk setiap tempat yang direkomendasikan.
5. Lokasi pengguna dari browser dikirim ke server supaya hasil dekat dengan pengguna. Lokasi bisa diganti manual lewat menu dengan koordinat.
6. Saran jadwal workout dan rencana kunjungan sesuai tujuan, tingkat kebugaran, dan waktu luang pengguna. Jadwal berupa teks.
7. Balasan dalam bahasa Indonesia.
8. Input suara lewat fitur pengenalan suara browser. Tersedia di browser yang mendukungnya.
9. Pembatasan request: 10 request per menit untuk setiap IP.
10. Validasi input: pesan maksimal 4000 karakter, riwayat yang dipakai 20 pesan terakhir.
11. Pesan error mentah dari server tidak tampil ke pengguna.
12. Tombol untuk memulai percakapan baru.

### Direncanakan

Semua fitur di bawah ini belum dibuat.

Peta

1. Gym terdekat tampil di peta di dalam antarmuka, lengkap dengan jarak. Saat ini Gymmy hanya memberi tautan ke Google Maps.

Chat

1. Lampiran foto yang benar-benar dikirim dan dianalisis. Saat ini lampiran hanya tampil di chat.

Home

1. Upcoming: jadwal workout dan kunjungan.
2. Gyms near you: jam buka, jarak, dan rating.
3. Activities mingguan.

Statistics

1. Kalender mingguan.
2. Overview: kalori terbakar, total waktu, dan jumlah latihan.
3. Daily progress: tidur, kalori, dan langkah.

Workout

1. Jadwal latihan terstruktur dan pengingat.

Pola makan

1. Kebutuhan kalori harian.
2. Target protein, karbohidrat, dan lemak.
3. Catatan makan.
4. Catatan minum dan target air harian.
5. Ringkasan gizi harian dan saran menu.

Navigasi

1. Home, Search, Statistics, dan Profile.

## Pola makan dan gizi (rencana)

Fitur ini membuat Gymmy membantu pengguna mengatur asupan harian, bukan hanya latihan.

### Yang akan dilakukan

1. Profil pengguna: usia, jenis kelamin, tinggi, berat, tingkat aktivitas, dan tujuan (turun berat badan, menjaga berat badan, atau menambah massa otot).
2. Kebutuhan kalori harian. Perhitungan memakai rumus Mifflin-St Jeor dan faktor aktivitas.
3. Target protein, karbohidrat, dan lemak berdasarkan berat badan dan tujuan.
4. Catatan makan lewat chat. Pengguna menulis apa yang dimakan, Gymmy memperkirakan kalori dan makro, lalu pengguna bisa mengoreksi.
5. Catatan minum, target air harian, dan pengingat.
6. Ringkasan harian: kalori masuk dibanding target dan kalori terbakar. Hasilnya tampil di cincin Daily progress.
7. Saran menu sesuai target dan selera pengguna.
8. Data makanan Indonesia dari sumber resmi, misalnya Tabel Komposisi Pangan Indonesia (TKPI). Sumber dipilih dan diperiksa sebelum dipakai.

### Aturan keselamatan

1. Gymmy bukan pengganti dokter atau ahli gizi. Aplikasi menyebutkan ini dengan jelas.
2. Kalori dari tebakan AI hanya perkiraan dan ditampilkan sebagai perkiraan.
3. Target kalori punya batas bawah aman. Gymmy tidak menyarankan target ekstrem, apa pun permintaan pengguna.
4. Untuk anak, ibu hamil atau menyusui, dan pengguna dengan kondisi kesehatan tertentu, Gymmy mengarahkan ke dokter atau ahli gizi dan tidak memberi angka target.
5. Gymmy tidak memuji atau mendorong pembatasan makan yang berlebihan.
6. Data berat badan dan makan termasuk data pribadi. Aplikasi meminta persetujuan, menyimpan data seminimal mungkin, dan mengikuti UU Pelindungan Data Pribadi.

### Rencana alat dan endpoint

Perhitungan angka dilakukan oleh server, bukan oleh Gemini. Gemini hanya memahami maksud pengguna, lalu memanggil alat. Alasannya, model bahasa bisa salah hitung.

1. `calculate_daily_needs`: hitung kalori dan makro harian dari profil.
2. `log_meal`: simpan makanan dan perkiraan gizinya.
3. `log_water`: simpan jumlah air yang diminum.
4. `get_daily_summary`: ringkasan kalori, makro, dan air hari ini.

Server sekarang belum memakai function calling. Sebelum tahap ini mulai, cek apakah function calling bisa dipakai bersama Grounding with Google Maps dalam satu permintaan. Jika tidak bisa, pisahkan menjadi dua alur.

## Batasan sekarang

1. Gymmy belum bisa memesan kunjungan. Tidak ada fitur booking di server, dan tidak ada kerja sama dengan gym. Jadwal dan rencana kunjungan hanya saran.
2. Gymmy tidak boleh mengarang harga, jarak, rating, atau jam buka. Jika Google Maps tidak memuat satu informasi, Gymmy tidak menyebutkannya.
3. Peta belum tampil di antarmuka. Pengguna membuka tautan Google Maps.
4. Pembatasan request tersimpan di memori server dan dihitung per IP. Hitungannya reset saat server restart. Jika server berjalan di belakang proxy, atur `trust proxy` di Express supaya IP pengguna terbaca benar.
5. Kuota Gemini paket gratis kecil. Grounding with Google Maps punya kuota dan biaya sendiri. Cek halaman harga Gemini API sebelum dipakai ramai.
6. Riwayat percakapan hanya ada di browser dan hilang saat halaman dimuat ulang.
7. Kode antarmuka untuk kartu fasilitas, modal pemesanan, dan quick reply masih ada di `public/script.js`. Server tidak lagi mengirim data untuk bagian itu, jadi bagian tersebut tidak muncul. Kode ini perlu dibersihkan atau dipakai lagi.
8. Belum ada autentikasi dan pengujian otomatis.
9. Data tidur dan langkah tidak bisa dibaca oleh web biasa. Itu butuh aplikasi mobile yang terhubung ke Apple Health atau Health Connect di Android. Pada awalnya pengguna mengisinya manual.

## Cara kerja

```
Pengguna -> Frontend -> POST /api/chat -> Gemini + Google Maps Grounding
                                                   |
                                  Gemini mencari tempat lewat Google Maps
                                                   |
                              Respons: teks balasan + daftar sumber Maps
```

Gemini tidak membuat data gym dari ingatannya. Alamat, rating, dan jam buka berasal dari Google Maps. Server hanya meneruskan percakapan, lokasi, dan hasil grounding.

## Struktur folder

```
Chatbot/
  gemini-chatbot-api/    Backend dan frontend yang dipakai sekarang
    index.js             Server Express dan logika chatbot
    package.json
    public/              Antarmuka chat (index.html, style.css, script.js)
  gemini-flash-api/      Percobaan awal: endpoint teks, gambar, dokumen, dan audio
  .postman/              Koleksi Postman untuk menguji API
  postman/globals/       Variabel global Postman
```

## Menjalankan di komputer sendiri

Syarat: Node.js 20 atau lebih baru, dan kunci API dari Google AI Studio.

1. Clone repo dan masuk ke folder backend.

```
git clone https://github.com/alifmassastronugroho/Chatbot.git
cd Chatbot/gemini-chatbot-api
```

2. Pasang dependensi.

```
npm install
```

3. Buat file `.env` di folder `gemini-chatbot-api`.

```
GEMINI_API_KEY=isi_kunci_kamu
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=3000
CLIENT_ORIGIN=
```

Keterangan:

1. `GEMINI_API_KEY`: wajib.
2. `GEMINI_MODEL`: opsional. Nilai bawaan `gemini-3.1-flash-lite`. Pastikan model yang kamu pilih mendukung Grounding with Google Maps.
3. `PORT`: opsional. Nilai bawaan 3000.
4. `CLIENT_ORIGIN`: opsional. Isi hanya jika frontend dibuka dari alamat lain. Tanpa isi, server menolak permintaan lintas origin.

4. Jalankan server.

```
npm start
```

Untuk mode pengembangan yang memuat ulang otomatis, pakai `npm run dev`.

5. Buka `http://localhost:3000`.

Keamanan: jangan pernah menulis kunci API di kode atau meng-commit file `.env`. File `.env` sudah ada di `.gitignore`. Jika kunci pernah terlihat di tempat publik, hapus kunci itu di Google AI Studio dan buat yang baru.

## API

### POST /api/chat

Permintaan:

```
{
  "conversation": [
    { "role": "user", "text": "Cari gym di Pamulang" }
  ],
  "location": { "lat": -6.3400, "lng": 106.7400 }
}
```

Keterangan:

1. `conversation`: riwayat pesan. `role` hanya boleh `user` atau `model`. Pesan terakhir harus dari `user` dan maksimal 4000 karakter. Server hanya memakai 20 pesan terakhir.
2. `location`: opsional. Berisi `lat` dan `lng` berupa angka. Tanpa lokasi, Gymmy menanyakan area atau kota kepada pengguna.

Respons sukses:

```
{
  "result": "Ini beberapa gym di sekitar Pamulang ...",
  "reply": "Ini beberapa gym di sekitar Pamulang ...",
  "sources": [
    { "title": "Nama Gym", "url": "https://maps.google.com/..." }
  ]
}
```

`result` dan `reply` berisi teks yang sama. `sources` berisi tautan Google Maps dari hasil grounding.

Kode error:

1. `400`: input tidak valid.
2. `429`: terlalu banyak request dari satu IP, atau kuota Gemini habis. Pembatasan request mengirim `code: "RATE_LIMITED"` dan header `Retry-After`.
3. `500`: kesalahan server.

## Rencana tahap demi tahap

Ini rencana, bukan janji. Tahap dikerjakan berurutan. Tahap berikutnya dimulai setelah tahap sebelumnya stabil.

### Sudah selesai

1. Pesan error mentah disembunyikan dari pengguna.
2. Pembatasan request per IP.
3. Pencarian gym lewat Grounding with Google Maps, menggantikan data gym manual.

### Tahap 1: Membuat prototipe bisa dipercaya

1. Tambah pengujian untuk validasi input, pembatasan request, dan bentuk respons.
2. Bersihkan kode frontend sisa fitur booking dan kartu fasilitas.
3. Atur `trust proxy` untuk deploy di belakang proxy.
4. Simpan riwayat percakapan, jika dibutuhkan.

### Tahap 2: Peta di antarmuka

1. Tampilkan gym sebagai penanda di peta, lengkap dengan jarak.
2. Tambah tombol arah ke lokasi lewat aplikasi peta.
3. Pilih cara menampilkan peta sebelum tahap ini mulai: Google Maps Platform atau OpenStreetMap dengan Leaflet.

### Tahap 3: Pola makan dan gizi

Mulai dari profil pengguna dan kebutuhan kalori harian. Lalu catatan makan, catatan minum, dan ringkasan harian. Lihat bagian "Pola makan dan gizi".

### Tahap 4: Layar Home dan Statistics

1. Akun pengguna dan login.
2. Home: kartu Upcoming, daftar Gyms near you, dan grafik Activities mingguan.
3. Statistics: kalender mingguan, Overview, dan Daily progress yang memuat kalori dari fitur pola makan.
4. Navigasi bawah: Home, Search, Statistics, Profile.
5. Pencatatan latihan: pengguna mencatat latihan, durasi, dan kalori terbakar.

### Tahap 5: Jadwal workout terstruktur

1. Jadwal berdasarkan tujuan dan jumlah hari latihan per minggu, seperti Full Body atau Upper/Lower Split.
2. Simpan jadwal, lalu tampilkan di kartu Upcoming.
3. Pengingat sebelum jadwal latihan atau kunjungan ke gym.

### Tahap 6: Jika project berlanjut

1. Kerja sama dengan gym untuk booking, konfirmasi, dan harga resmi.
2. Aplikasi mobile dengan sinkron Apple Health atau Health Connect.
3. Lampiran foto makanan yang dianalisis.
4. Deploy ke server publik.

## Teknologi

1. Node.js dan Express 5
2. Google Gemini lewat SDK `@google/genai`, dengan alat Grounding with Google Maps
3. HTML, CSS, dan JavaScript untuk antarmuka
4. Postman untuk pengujian API
5. Rencana: peta di antarmuka (Google Maps Platform atau OpenStreetMap dengan Leaflet) dan database. Keduanya belum dipilih.
