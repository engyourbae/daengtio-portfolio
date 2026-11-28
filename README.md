# daengtio-portfolio

Portofolio pribadi Daeng Tio Waldi. Astro 5 + TypeScript, situs statis, deploy ke GitHub Pages lewat GitHub Actions.

## Keputusan desain

- **Konsep: Spider-Man, versi dewasa dan rapi.** Terang = suit merah (merah, biru tua, putih, halftone halus, jaring tipis). Gelap = Black Suit (hitam, perak, biru baja, jaring perak, debu partikel). Tema awal mengikuti `prefers-color-scheme`, pilihan tersimpan di localStorage (`dt-theme`) dan diterapkan sebelum render pertama. Semua warna adalah token di `src/styles/tokens.css`.
- **Foto formal + radar** (`ProfilePhoto.astro`, `Radar.astro`, `src/lib/radar.ts`): potret formal berblazer biru; lensa bulat berpatroli pelan di sekitar wajah, lalu mengikuti kursor / jari dan menyingkap lapisan siluet Spider-Man yang tersejajar dengan foto. Klik / tap = pose aksi.
- **Kartu ID menggantung** (`IdCard.astro`, `src/lib/idcard.ts`): dua benang jaring SVG, ayunan pendulum teredam, bisa ditarik (mouse/jari), panah kiri/kanan di keyboard, bereaksi pada scroll. Isi kartu tetap teks asli.
- **Animasi scroll dua arah**: elemen `data-reveal` masuk dan keluar berulang (kelas `.is-in`, dengan hysteresis), arah scroll di `html[data-dir]`, SplitText (huruf/kata/baris), parallax, marquee yang kecepatan dan arahnya mengikuti scroll, judul miring tipis (`--vel`), counter yang menghitung ulang.
- **Latar halus** (`Backdrop.astro`, `src/lib/backdrop.ts`): glow tint per section, sorot mengikuti kursor, debu tiga kedalaman (tema gelap).
- **Interaksi di semua elemen**: hover, sentuh (`.is-touch`, ikut berpindah saat jari menggeser), dan fokus keyboard memakai gaya yang sama. Kursor titik + cincin dengan label (`Buka`, `Radar`, `Tarik`, `Salin`, `Kirim`, ...) hanya untuk mouse.
- **Satu loop `requestAnimationFrame`** (`src/lib/engine.ts`), listener pasif, berhenti saat tab tersembunyi. Hanya transform, opacity, filter ringan, dan variabel CSS yang dianimasikan.
- **`prefers-reduced-motion`**: tanpa patroli, tanpa kursor kustom, kartu ID diam, reveal tanpa gerak. **Tanpa JavaScript** semua konten tetap terlihat.
- **Font**: Anton (display) dan Instrument Sans, self-hosted lewat `@fontsource`, subset latin; Anton di-preload.
- **Meta**: JSON-LD (`Person`, `WebSite`, `ProfilePage`), Open Graph + Twitter card, `theme-color` per tema, meta PWA.

## Perintah

```bash
npm install     # pertama kali (menghasilkan package-lock.json, wajib di-commit)
npm run dev     # http://localhost:4321/daengtio-portfolio/
npm run build   # hasil di dist/
npm run preview
```

## Struktur

```
.github/workflows/deploy.yml   deploy GitHub Pages
public/assets/
  brand/     mark.png, wordmark.png (logo engyourbae), favicon, ikon PWA, apple-touch-icon
  og/        og-default.jpg (1200x630, <200KB)
  profile/   profile-formal.webp, profile-normal.webp, lapisan siluet, pose aksi
  projects/  <slug>.webp|png|svg  (ikon tiap project)
src/
  components/  satu komponen satu tanggung jawab
  data/site.ts satu-satunya tempat edit konten
  layouts/Base.astro  meta, OG, JSON-LD, skrip tema
  pages/       index, 404, site.webmanifest, robots.txt, sitemap.xml
  lib/         engine, motion, fx, radar, idcard, backdrop (skrip klien bersama)
  styles/      tokens, base, components, sections, hero, photo, radar, idcard, backdrop, fx, header
```

## Foto, logo, dan ikon

| File | Keterangan |
|---|---|
| `profile/profile-formal.webp` | Foto formal (896x1196). Latar biru sudah dihapus (cutout transparan) |
| `profile/profile-normal.webp` | Foto biasa untuk kartu ID dan kondisi diam |
| `profile/profile-hero-red.webp`, `profile/profile-main.webp` | Lapisan siluet yang disingkap lensa radar (merah = tema terang, hitam = tema gelap) |
| `profile/profile-action.webp`, `profile/profile-alt.webp` | Pose aksi (terang / gelap) |
| `projects/<slug>.webp` | Ikon project, persegi 480x480 |

**Mengganti foto formal:** lapisan siluet disejajarkan dengan foto formal lewat angka `fit` (`left`, `top`, `width`, dalam persen) di `photos.radar` pada `src/data/site.ts`. Bila foto formal diganti dengan komposisi berbeda, lapisan harus disejajarkan ulang (ubah `fit`) atau lensa tidak akan pas. Posisi wajah dan jari-jari lensa ada di `photos.lens`.

Slug project: `kasir-daeng`, `pintara`, `duopop`, `financepay`, `bimtrack`, `tidal-tales`, `memory-mbs`. Project tanpa ikon menampilkan monogram huruf awal.

Logo: `brand/mark.png` dan `brand/wordmark.png` adalah mask (hanya kanal alpha yang dipakai), warnanya mengikuti tema. Ikon aplikasi (`icon-*.png`, `apple-touch-icon.png`, `favicon.*`) berasal dari ikon kotak hitam engyourbae.

## Variables GitHub Actions

Settings → Secrets and variables → Actions → tab **Variables** (bukan Secrets; link portofolio memang publik). Semua opsional.

| Variable | Fungsi |
|---|---|
| `PUBLIC_SITE_URL` | Domain situs, mis. `https://engyourbae.github.io` |
| `BASE_PATH` | Kosong = otomatis nama repo (`/` untuk repo `*.github.io`) |
| `PUBLIC_CONTACT_EMAIL` | Email di bagian Kontak |
| `PUBLIC_GITHUB_URL`, `PUBLIC_INSTAGRAM_URL`, `PUBLIC_TIKTOK_URL` | Tautan sosial (kotak kontak Gmail / Instagram / TikTok / GitHub) |
| `PUBLIC_FORM_ENDPOINT` | Endpoint form (mis. Formspree). Kosong = form disembunyikan |
| `PUBLIC_URL_KASIR_DAENG`, `PUBLIC_URL_PINTARA`, `PUBLIC_URL_DUOPOP`, `PUBLIC_URL_FINANCEPAY`, `PUBLIC_URL_BIMTRACK`, `PUBLIC_URL_TIDAL_TALES`, `PUBLIC_URL_MEMORY_MBS` | Link tiap project. Kosong = nilai bawaan di `site.ts`; bila bawaan juga dikosongkan, kartu menampilkan "Segera hadir" |

Nilai variable ikut tertulis di HTML hasil build. Jangan simpan API key atau data rahasia di sini.

## Menambah project

Tambah satu entri `mk({...})` di `src/data/site.ts`, taruh ikon di `public/assets/projects/<slug>.webp`. Untuk link lewat Variables, tambah `PUBLIC_URL_<NAMA>` di `site.ts`, `.env.example`, dan blok `env` di `deploy.yml`.

## Deploy

1. Push ke branch `main` di repo `engyourbae/daengtio-portfolio`.
2. Settings → Pages → Source: **GitHub Actions**.
3. (Opsional) isi Variables di atas, lalu jalankan ulang workflow.

## Menambah sertifikat

Isi array `certificates` di `src/data/site.ts`; section muncul otomatis bila ada isinya.

## Checklist sebelum publish

- [ ] Hapus file lama yang sudah tidak dipakai: `src/styles/global.css` dan `public/assets/og/og-default.png`
- [ ] `npm install` lalu commit `package-lock.json`
- [ ] Ganti foto dan ikon project
- [ ] Cek deskripsi bertanda `TODO` di `src/data/site.ts` (Bimtrack, "Berbasis di")
- [ ] Isi `certificates` bila ada (section tampil otomatis)
- [ ] Buka situs di handphone, tablet, laptop; coba ketiga tema
- [ ] Jalankan Lighthouse manual di Chrome (mode Incognito, tab Lighthouse, Mobile lalu Desktop) untuk **Performance**, **Accessibility**, **Best Practices**, dan **SEO**, di kedua tema. Catat skor dan perbaiki bila ada yang turun
- [ ] Uji di handphone sungguhan (Android dan iOS): tarik kartu ID, sentuh-geser foto, scroll cepat, putar layar

## Catatan pengujian (jujur)

Perubahan Fase 3 **belum pernah dibangun dengan `npm run build` Astro** di lingkungan pengerjaan (tanpa akses npm). Pengujian memakai harness statis buatan sendiri di Chromium (Playwright): render 360 dan 1280 px di kedua tema tanpa error JS dan tanpa overflow horizontal, serta event pointer / sentuh sintetis untuk radar, kartu ID, `.is-touch`, reveal dua arah, counter, marquee, reduced-motion, dan tampilan tanpa JS. **Tidak diuji** di handphone sungguhan, Safari / Firefox, maupun dengan screen reader, dan Lighthouse belum dijalankan. Bila `npm run build` menampilkan galat, mulai dari sana.
