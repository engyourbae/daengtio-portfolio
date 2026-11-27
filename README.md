# daengtio-portfolio

Portofolio pribadi Daeng Tio Waldi. Astro 5 + TypeScript, situs statis, deploy ke GitHub Pages lewat GitHub Actions.

## Keputusan desain

- **Konsep: Spider-Man, versi dewasa dan rapi.** Tema **Terang** = suit merah (merah, biru tua, putih, halftone komik halus, jaring tipis). Tema **Gelap** = Black Suit (hitam pekat, perak, biru baja, jaring perak, partikel debu). Tema awal mengikuti `prefers-color-scheme`, pilihan tersimpan di localStorage (`dt-theme`), diterapkan sebelum render pertama sehingga tidak berkedip. Nilai lama (`siang`, `malam`, `zenith`) dimigrasikan otomatis. Semua warna adalah token di `src/styles/tokens.css`.
- **Foto profil interaktif** (`ProfilePhoto.astro`): diam, lalu hover / tap pertama / fokus keyboard memunculkan foto *half* (mask yang mengikuti pointer bila foto *normal* tersedia, riak spider-sense, tilt halus), lalu klik / tap kedua / tahan menampilkan pose aksi dengan burst jaring. Tap ketiga atau diam beberapa detik mengembalikan ke awal. Varian merah/hitam mengikuti tema, termasuk saat tema diganti. Mendukung keyboard (Tab, Enter/Spasi, Esc), `aria-pressed`, dan `prefers-reduced-motion` (crossfade saja).
- **Loader**: hitungan persen + jaring yang menggambar diri, hanya sekali per sesi dan dilewati untuk reduced-motion. Ada pengaman 7 detik bila skrip gagal.
- **Font.** Anton (display, padat, bertenaga ala poster komik) dan Instrument Sans (isi), self-hosted lewat `@fontsource`.
- **Animasi.** Loader, kata-kata judul naik satu per satu, jaring menggambar diri, chip melayang, marquee skill, reveal saat scroll (`data-reveal`), pil header kaca dengan benang progres. Semua mengikuti `prefers-reduced-motion`.
- **Ikon.** Set SVG inline satu gaya (`Icon.astro`), tanpa emoji.

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
  og/        og-default.png (1200x630)
  profile/   profile-main.*, profile-alt.*
  projects/  <slug>.webp|png|svg  (ikon tiap project)
src/
  components/  satu komponen satu tanggung jawab
  data/site.ts satu-satunya tempat edit konten
  layouts/Base.astro  meta, OG, JSON-LD, skrip tema
  pages/       index, 404, site.webmanifest, robots.txt, sitemap.xml
  styles/      tokens.css, base.css, components.css
```

## Foto, logo, dan ikon

Semua foto profil berupa **cutout transparan** (webp alpha, tanpa latar biru), jadi duduk di atas disc dan jaring di hero. Untuk menggantinya, taruh file dengan nama yang tepat (urutan prioritas: webp, avif, png, jpg, svg). Gunakan PNG/WebP **dengan alpha**, potret rata bawah.

| File | Keterangan |
|---|---|
| `profile/profile-normal.webp` | **Belum ada (TODO).** Foto biasa tanpa Spider-Man, cutout transparan, komposisi sama dengan `profile-main`. Bila ada, kondisi diam memakai foto ini dan foto *half* terungkap mengikuti pointer. Bila belum ada, kondisi diam memakai foto *half* |
| `profile/profile-hero-red.webp` | *Half*, varian merah (tema terang) |
| `profile/profile-main.webp` | *Half*, varian hitam (tema gelap) |
| `profile/profile-action.webp` | Pose aksi, varian merah (tema terang) |
| `profile/profile-alt.webp` | Pose aksi, varian hitam (tema gelap) |
| `public/assets/projects/<slug>.webp` | Ikon project, persegi 480x480 |

Slug project: `kasir-daeng`, `pintara`, `duopop`, `financepay`, `bimtrack`, `tidal-tales`, `memory-mbs`. Project tanpa ikon menampilkan monogram huruf awal.

Logo: `brand/mark.png` dan `brand/wordmark.png` adalah mask (hanya kanal alpha yang dipakai), warnanya mengikuti tema. Ikon aplikasi (`icon-*.png`, `apple-touch-icon.png`, `favicon.*`) berasal dari ikon kotak hitam engyourbae.

## Variables GitHub Actions

Settings → Secrets and variables → Actions → tab **Variables** (bukan Secrets; link portofolio memang publik). Semua opsional.

| Variable | Fungsi |
|---|---|
| `PUBLIC_SITE_URL` | Domain situs, mis. `https://engyourbae.github.io` |
| `BASE_PATH` | Kosong = otomatis nama repo (`/` untuk repo `*.github.io`) |
| `PUBLIC_CONTACT_EMAIL` | Email di bagian Kontak |
| `PUBLIC_GITHUB_URL`, `PUBLIC_INSTAGRAM_URL` | Tautan sosial |
| `PUBLIC_FORM_ENDPOINT` | Endpoint form (mis. Formspree). Kosong = form disembunyikan |
| `PUBLIC_URL_KASIR_DAENG`, `PUBLIC_URL_PINTARA`, `PUBLIC_URL_DUOPOP`, `PUBLIC_URL_FINANCEPAY`, `PUBLIC_URL_BIMTRACK`, `PUBLIC_URL_TIDAL_TALES`, `PUBLIC_URL_MEMORY_MBS` | Link tiap project. Kosong = nilai bawaan di `site.ts`; bila bawaan juga dikosongkan, kartu menampilkan "Segera hadir" |

Nilai variable ikut tertulis di HTML hasil build. Jangan simpan API key atau data rahasia di sini.

## Menambah project

Tambah satu entri `mk({...})` di `src/data/site.ts`, taruh ikon di `public/assets/projects/<slug>.webp`. Untuk link lewat Variables, tambah `PUBLIC_URL_<NAMA>` di `site.ts`, `.env.example`, dan blok `env` di `deploy.yml`.

## Deploy

1. Push ke branch `main` di repo `engyourbae/daengtio-portfolio`.
2. Settings → Pages → Source: **GitHub Actions**.
3. (Opsional) isi Variables di atas, lalu jalankan ulang workflow.

## Checklist sebelum publish

- [ ] `npm install` lalu commit `package-lock.json`
- [ ] Ganti foto dan ikon project
- [ ] Cek deskripsi bertanda `TODO` di `src/data/site.ts` (Bimtrack, "Berbasis di")
- [ ] Isi `certificates` bila ada (section tampil otomatis)
- [ ] Buka situs di handphone, tablet, laptop; coba ketiga tema
