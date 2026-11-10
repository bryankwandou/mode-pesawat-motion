# Mode Pesawat - Interactive Motion Landing Page

Website landing page interaktif berbasis animasi kanvas beresolusi tinggi yang diadaptasi dari video musik resmi "Mode Pesawat" oleh Dandy Barakati feat. Dante Nababan.

## Fitur Utama

- **Scroll-Driven Canvas Sequence**: Animasi kanvas 60 FPS yang merespons pergerakan scroll pengguna secara mulus menggunakan algoritma linear interpolation.
- **WebP Frame Optimization**: 168 frame berkualitas tinggi diekstraksi menggunakan FFmpeg dengan format WebP terkompresi.
- **Sinkronisasi Audio Interaktif**: Pemutar audio terintegrasi dengan indikator visualizer gelombang suara dinamis.
- **Auto Motion Mode**: Mode pemutaran otomatis yang memungkinkan eksplorasi konten tanpa perlu menggulir manual.
- **HUD & Status Real-time**: Indikator penghitung nomor frame, persentase scroll, dan sinkronisasi frame rate.
- **Desain Responsif**: Penyesuaian aspek rasio kanvas otomatis untuk berbagai ukuran layar.

## Struktur Direktori

```
mode-pesawat-motion/
├── public/
│   ├── audio/
│   │   └── mode_pesawat.mp3
│   ├── frames/
│   │   └── frame_0001.webp ... frame_0168.webp
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── extract_frames.js
├── package.json
├── README.md
└── server.js
```

## Menjalankan Server Lokal

Jalankan perintah berikut pada terminal:

```bash
node server.js
```

Buka peramban web pada alamat:
`http://localhost:3000`
