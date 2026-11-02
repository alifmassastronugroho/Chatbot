
<h1 align="center">Gymmy</h1>

<p align="center">Asisten olahraga pribadi berbasis chat</p>

Gymmy adalah asisten olahraga pribadi berbasis chat. Pengguna mencari gym terdekat, memesan kunjungan, menyusun jadwal latihan, dan mengatur pola makan lewat satu percakapan.

Status: prototipe. Fitur chat dan pencarian gym sudah jalan. Peta, layar Home dan Statistics, serta fitur pola makan masih rencana.


## Masalah yang ingin diselesaikan

Orang yang ingin mulai berolahraga sering berhenti di langkah awal. Mereka tidak tahu gym mana yang dekat, berapa harganya, bagaimana menyusun latihan, dan berapa banyak yang harus dimakan. Gymmy menjawab semuanya di satu tempat.

## Target pengguna

1. Pemula yang ingin rutin berolahraga tapi bingung memulai.
2. Mahasiswa dan pekerja dengan waktu terbatas.
3. Orang yang baru pindah ke satu area dan belum tahu gym di sekitarnya.
4. Orang yang ingin mengatur makan dan minum sesuai tujuan kebugarannya.

## Fitur

### Prototipe

1. Antarmuka chat dengan mode terang dan gelap, untuk layar mobile dan desktop.
2. Server Express dengan satu endpoint chat.
3. Gemini sebagai pemahaman bahasa, memakai function calling. Model memilih alat yang tepat, server yang menjalankannya.
4. Pencarian fasilitas terdekat. Server menghitung jarak dari lokasi pengguna ke tiap gym, lalu mengurutkannya.
5. Filter fasilitas: Gym, SPA, dan Pool.
6. Tombol "opsi lain" yang tidak mengulang gym yang sudah tampil.
7. Pemesanan kunjungan lewat chat.
8. Saran latihan singkat dan jawaban seputar kebugaran dari Gemini.
9. Balasan mengikuti bahasa pengguna.

### Direncanakan

Semua fitur di bawah ini belum dibuat.

**Peta**

1. Gym terdekat di peta, lengkap dengan jarak dan arah ke lokasi.

**Chat**

1. Input suara dan lampiran foto.

**Home**

1. Upcoming: jadwal workout dan booking.
2. Gyms near you: jam buka, jarak, dan rating. Saat ini baru ada di chat.
3. Activities mingguan.

**Statistics**

1. Kalender mingguan.
2. Overview: kalori terbakar, total waktu, dan jumlah latihan.
3. Daily progress: tidur, kalori, dan langkah.

**Workout**

1. Jadwal latihan terstruktur dan pengingat.

**Pola makan**

1. Kebutuhan kalori harian.
2. Target protein, karbohidrat, dan lemak.
3. Catatan makan.
4. Catatan minum dan target air harian.
5. Ringkasan gizi harian dan saran menu.

**Navigasi**

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

Semua ini belum dibuat.

## Peta dan gym terdekat (rencana)

Pencarian sekarang memakai data manual. Rencananya, pengguna melihat gym di peta dan membuka arah ke lokasinya.

1. Ambil lokasi pengguna dari browser, dengan izin pengguna.
2. Tampilkan gym sebagai penanda di peta lengkap dengan jarak.
3. Ambil data tempat dari layanan peta, lalu gabungkan dengan data manual untuk harga.
4. Tambah tombol arah ke gym lewat aplikasi peta.
5. Tambah filter jarak, harga, jam buka, rating, dan fasilitas.

Pilihan layanan peta. Keputusan diambil sebelum tahap ini mulai.

1. Google Maps Platform. Data lengkap, termasuk rating dan jam buka. Perlu akun billing, jadi cek harga terbaru dulu.
2. OpenStreetMap dengan Leaflet. Gratis, tapi data gym di Indonesia kurang lengkap, dan harga atau jam buka sering kosong.

## Batasan sekarang

1. Data gym diisi manual di `gemini-chatbot-api/data/facilities.json`. Belum ada sumber data luar.
2. Booking tersimpan di memori server. Datanya hilang saat server restart.
3. Booking belum terhubung ke gym mana pun. Gym tidak menerima atau mengonfirmasi pesanan.
4. Server belum mengecek jam buka saat booking.
5. Kuota API Gemini paket gratis kecil. Satu pesan pencarian memakai sampai 2 request.
6. Belum ada autentikasi, pembatasan request, dan pengujian otomatis.
7. Jadwal workout masih berupa teks bebas dari Gemini, belum terstruktur.
8. Data tidur dan langkah tidak bisa dibaca oleh web biasa. Itu butuh aplikasi mobile yang terhubung ke Apple Health atau Health Connect di Android. Pada awalnya pengguna mengisinya manual.

## Cara kerja

```
Pengguna -> Frontend -> POST /api/chat -> Gemini
                                             |
                           memanggil alat (function calling)
                                             |
                          search_facilities / book_visit
                                             |
                          Server membaca data gym, menghitung jarak,
                          menyimpan booking
                                             |
                  Respons: teks balasan + kartu + quick reply
```

Gemini tidak membuat data gym. Semua nama, jarak, dan harga berasal dari data milik server.

## Struktur folder

```
Chatbot/
  gemini-chatbot-api/    Backend dan frontend yang dipakai sekarang
    index.js             Server Express dan logika chatbot
    data/facilities.json Data gym
    public/              Antarmuka chat
  gemini-flash-api/      Percobaan awal
  docs/                  Logo dan gambar untuk README
    logo.svg
    ui-preview.png
  .postman/              Koleksi Postman untuk menguji API
```

## Menjalankan di komputer sendiri

Syarat: Node.js 18 atau lebih baru, dan kunci API dari Google AI Studio.

1. Clone repo dan masuk ke folder backend.

```bash
git clone https://github.com/alifmassastronugroho/Chatbot.git
cd Chatbot/gemini-chatbot-api
```

2. Pasang dependensi.

```bash
npm install
```

3. Buat file `.env` di folder `gemini-chatbot-api`.

```
GEMINI_API_KEY=isi_kunci_kamu
GEMINI_MODEL=isi_nama_model
PORT=3000
```

Pastikan `index.js` membaca model dari `.env`:

```js
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'isi_nama_model';
```

4. Jalankan server.

```bash
node index.js
```

5. Buka `http://localhost:3000`.

Keamanan: jangan pernah menulis kunci API di kode atau meng-commit file `.env`. Pastikan `.env` ada di `.gitignore`. Jika kunci pernah terlihat di tempat publik, hapus kunci itu di Google AI Studio dan buat yang baru.

## API

### POST /api/chat

Permintaan:

```json
{
  "conversation": [
    { "role": "user", "text": "Show me gyms nearby" }
  ],
  "location": { "lat": -6.1754, "lng": 106.8272 },
  "shownIds": ["gym-001"]
}
```

Keterangan:

1. `conversation`: riwayat pesan. `role` hanya boleh `user` atau `model`. Pesan terakhir harus dari `user`. Server hanya memakai 20 pesan terakhir.
2. `location`: opsional. Tanpa lokasi, Gymmy meminta pengguna mengaktifkan lokasi sebelum mencari gym.
3. `shownIds`: opsional. Berisi id gym yang sudah tampil, dipakai untuk "opsi lain".

Respons sukses:

```json
{
  "reply": "Ini gym terdekat dari kamu.",
  "cards": [
    {
      "type": "facility",
      "id": "gym-001",
      "name": "BodyWorks",
      "distance": 250,
      "price": "Rp 50.000 / masuk sehari",
      "hours": "06:00-22:00",
      "facilities": ["Gym", "SPA", "Pool"]
    }
  ],
  "quickReplies": ["Show me other options", "Book me a visit in a gym"]
}
```

Jarak dalam meter. Kartu bertipe `booking` muncul setelah pemesanan berhasil.

Kode error:

1. `400`: input tidak valid.
2. `429`: kuota Gemini habis.
3. `500`: kesalahan server.

## Menambah data gym

Buka `gemini-chatbot-api/data/facilities.json` dan tambah satu entri.

```json
{
  "id": "gym-004",
  "name": "Nama Gym",
  "address": "Alamat singkat",
  "lat": -6.3400,
  "lng": 106.7400,
  "price": "Rp 30.000 / masuk sehari",
  "hours": "06:00-22:00",
  "facilities": ["Gym", "Pool"]
}
```

Aturannya: `id` harus unik, dan `facilities` hanya berisi `Gym`, `SPA`, atau `Pool`. Ambil koordinat dari Google Maps dengan klik kanan pada lokasi gym.

## Rencana tahap demi tahap

Ini rencana, bukan janji. Tahap dikerjakan berurutan. Tahap berikutnya dimulai setelah tahap sebelumnya stabil.

### Tahap 1: Membuat prototipe bisa dipercaya

1. Simpan booking di database, supaya data tidak hilang saat restart.
2. Cek jam buka dan bentrok jadwal saat booking.
3. Sembunyikan pesan error mentah dari pengguna.
4. Batasi jumlah request per pengguna.
5. Tambah pengujian untuk pencarian, jarak, dan booking.

### Tahap 2: Peta dan gym terdekat

Lihat bagian "Peta dan gym terdekat".

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

1. Kerja sama dengan gym untuk konfirmasi booking dan harga resmi.
2. Aplikasi mobile dengan sinkron Apple Health atau Health Connect.
3. Input suara dan lampiran foto makanan, sesuai ikon di desain.
4. Deploy ke server publik.

## Teknologi

1. Node.js dan Express 5
2. Google Gemini lewat SDK `@google/genai`
3. HTML, CSS, dan JavaScript untuk antarmuka
4. Postman untuk pengujian API
5. Rencana: layanan peta (Google Maps Platform atau OpenStreetMap dengan Leaflet) dan database. Keduanya belum dipilih.
