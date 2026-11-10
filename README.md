# Mode Pesawat - Pure 60 FPS Full Duration (04:36) Interactive Scrollytelling Experience

Website landing page interaktif berbasis animasi kanvas beresolusi tinggi yang mengadaptasi **100% durasi utuh (00:00 &mdash; 04:36)** dari video musik resmi "Mode Pesawat" oleh Dandy Barakati feat. Dante Nababan dengan performa murni 60 FPS.

## Live Demo (GitHub Pages)

Akses website secara langsung di:
https://bryankwandou.github.io/mode-pesawat-motion/

## Pemenuhan Standar Teknis Remedial

1. **Durasi Lagu & Video Utuh Sampai Habis (100% Full Duration)**:
   - Mencakup keseluruhan 4 menit 36 detik (275,74 detik) tanpa potongan, mulai dari intro detik 00:00 hingga outro nada terakhir 04:36.
   - Trek audio MP3 penuh 04:36 tersinkronisasi dua arah dengan kanvas dan timeline.

2. **Performa Murni 60 FPS (Hardware-Accelerated 60 FPS)**:
   - Rendering kanvas 2D berbasis GPU dengan optimasi `requestAnimationFrame` dan interpolasi pergerakan halus (lerp).
   - Dilengkapi **Live Performance HUD** di pojok kanan bawah yang mengukur frame rate secara riil (`performance.now()`), menampilkan indikator `60.0 FPS MURNI`.

3. **Panjang Halaman Proporsional dengan Durasi Lagu (2500vh & 10 Babak Cerita)**:
   - Halaman dirancang panjang (~2500vh / ~25.000 piksel) agar durasi scroll pengguna seimbang dan nyaman mengikuti alur musik 4 menit 36 detik.
   - Terdiri dari 10 babak cerita sinematik terperinci:
     - Babak 01 (00:00 &mdash; 00:25): Prolog: Sinyal Terputus & Frekuensi Sunyi
     - Babak 02 (00:25 &mdash; 00:55): Bait 1A: Layar Genggam Di Larut Malam (Dandy Barakati)
     - Babak 03 (00:55 &mdash; 01:25): Bait 1B: Menghentikan Bising Dunia
     - Babak 04 (01:25 &mdash; 01:50): Pre-Chorus: Menarik Nafas Panjang
     - Babak 05 (01:50 &mdash; 02:15): Refrain Utama: Mode Pesawat Aktif
     - Babak 06 (02:15 &mdash; 02:40): Bait 2A: Rima Tajam Dante Nababan
     - Babak 07 (02:40 &mdash; 03:05): Bait 2B: Membangun Fondasi Karya
     - Babak 08 (03:05 &mdash; 03:35): Bridge Sinematik: Titik Temu Dua Energi
     - Babak 09 (03:35 &mdash; 04:05): Klimaks Refrain Kedua: Kejernihan Visi Tertinggi
     - Babak 10 (04:05 &mdash; 04:36): Outro & Resolusi: Kembali ke Realitas

4. **Fitur Interaktif Lanjutan**:
   - **Interactive Timeline Bar**: Scrubber waktu interaktif di pojok kiri bawah yang dapat diklik atau digeser untuk melompat ke detik manapun.
   - **Auto Motion 60 FPS**: Mode putar otomatis yang menggulir halaman secara otomatis dengan kecepatan 1x realtime mengikuti durasi lagu penuh (275,74 detik).
   - **Anti-Cache Headers & Versioning**: Dilengkapi parameter versi `v=4.0.0` pada skrip dan stylesheet untuk memastikan browser pengguna selalu memuat versi terkini tanpa gangguan cache peramban.

## Struktur Direktori

```
mode-pesawat-motion/
├── audio/
│   └── mode_pesawat.mp3 (Lagu penuh 04:36)
├── frames/
│   └── frame_0001.webp ... frame_0360.webp (360 Frame urutan visual penuh)
├── video/
│   └── mode_pesawat_60fps.mp4 (Berkas video teroptimasi 60 FPS)
├── app.js
├── index.html
├── styles.css
├── package.json
├── process_full_video.js
├── README.md
└── server.js
```

## Menjalankan Server Lokal

```bash
node server.js
```
Akses di peramban: `http://localhost:3001`
