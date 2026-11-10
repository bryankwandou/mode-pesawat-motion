# Mode Pesawat - Full Music Video Interactive Motion Experience

Website landing page interaktif berbasis animasi kanvas beresolusi tinggi yang mengadaptasi **100% durasi penuh (00:00 &mdash; 04:36)** dari video musik resmi "Mode Pesawat" oleh Dandy Barakati feat. Dante Nababan.

## Live Demo (GitHub Pages)

Akses website secara langsung di:
https://bryankwandou.github.io/mode-pesawat-motion/

## Spesifikasi Teknis Remedial

- **Cakupan Video Penuh (100%)**: Mengonversi keseluruhan video musik berdurasi 4 menit 36 detik (275,74 detik) tanpa potongan, mencakup seluruh bait lirik, refrain, rap verse, bridge, dan outro.
- **360 Frame WebP Teroptimasi**: 360 frame gambar WebP berkualitas tinggi dengan kompresi cerdas (~11 MB total) untuk rendering kanvas instan tanpa lag.
- **Audio Lengkap Penuh (04:36)**: Trek audio MP3 penuh yang diekstrak langsung dari berkas video resmi dengan kontrol pemutar interaktif dan visualizer gelombang suara.
- **Indikator Waktu Riil (HUD Video Time)**: Menampilkan detik dan menit aktual video (`00:00 / 04:36`) yang secara matematis tersinkronisasi dengan posisi scroll pengguna.
- **Navigasi 6 Babak Sinematik**:
  - Babak 01 (00:00 &mdash; 00:35): Pembuka & Sinyal Terputus
  - Babak 02 (00:35 &mdash; 01:25): Bait 1 & Tekanan Layar Digital (Dandy Barakati)
  - Babak 03 (01:25 &mdash; 02:15): Refrain Utama "Mode Pesawat"
  - Babak 04 (02:15 &mdash; 03:05): Bait 2 & Flow Dinamis (Dante Nababan)
  - Babak 05 (03:05 &mdash; 03:45): Bridge & Interlude Sinematik
  - Babak 06 (03:45 &mdash; 04:36): Outro Resolusi & Distribusi Musik
- **Auto Motion Mode**: Mode pemutaran otomatis yang memungkinkan penonton menikmati keseluruhan alur video tanpa harus menggulir manual.

## Struktur Direktori

```
mode-pesawat-motion/
├── audio/
│   └── mode_pesawat.mp3 (Lagu penuh 04:36)
├── frames/
│   └── frame_0001.webp ... frame_0360.webp (360 Frame video penuh)
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
