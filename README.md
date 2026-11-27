# daengtio-portfolio

Portofolio pribadi Daeng Tio Waldi. Astro 5 + TypeScript, situs statis, deploy ke GitHub Pages lewat GitHub Actions.

## Keputusan desain

- **Konsep: garis khatulistiwa.** Pontianak dilintasi garis 0°. Garis itu menjadi tulang punggung visual: garis dan matahari di hero, penanda progres scroll di header, dan logo "e" engyourbae yang warnanya mengikuti tema (dipakai sebagai mask CSS).
- **Tiga tema.** *Siang* (terang, hijau-abu dingin, matahari jingga), *Malam* (biru-hijau laut dalam, matahari emas), *Zenith* (kobalt penuh, matahari kuning, tema custom). Semua warna berupa token CSS di `src/styles/tokens.css`.
- **Font.** Unbounded untuk judul (lebar, geometris, berkarakter) dan Instrument Sans untuk isi (netral, mudah dibaca). Keduanya self-hosted lewat `@fontsource-variable`.
- **Animasi.** Hanya satu momen terarah: matahari terbit dan garis menarik saat hero dimuat. Sisanya respons terhadap aksi (hover, ganti tema, salin email). Semua mengikuti `prefers-reduced-motion`.
- **Ikon.** Set SVG inline satu gaya (`Icon.astro`), tanpa emoji dan tanpa ikon bawaan browser. Kontrol form, scrollbar, fokus, dan seleksi teks sudah di-custom.

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

Foto profil sudah berupa **cutout transparan** (latar biru dihapus), jadi duduk di atas matahari dan garis khatulistiwa di hero. Untuk menggantinya, taruh file dengan nama yang tepat (urutan prioritas: webp, avif, png, jpg, svg). Gunakan PNG/WebP **dengan alpha**, potret rata bawah.

| File | Keterangan |
|---|---|
| `public/assets/profile/profile-main.webp` | Foto utama (sekarang: potret separuh wajah black spider) |
| `public/assets/profile/profile-alt.webp` | Tampil saat hover (desktop) atau tap (layar sentuh). Hapus file ini bila tidak ingin efek ganti foto |
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
