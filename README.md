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
- **Meta**: JSON-LD (`Person`, `WebSite`, `ProfilePage`), Open Graph + Twitter card, `theme-color` per skema warna (dua meta, disamakan skrip dengan tema pilihan), meta PWA.
- **Prewarm, tema mulus, kunci zoom/salin**: lihat tiga bagian di bawah.

## Prewarm dan performa

Layar loader (`Loader.astro` + `src/lib/prewarm.ts`) mengerjakan semua hal berat sekali di awal, supaya scroll pertama, animasi masuk pertama, dan ganti tema ringan. Urutannya:

1. **Aset**: tunggu font, lalu `img.decode()` untuk gambar kritis (hero: foto, siluet merah/hitam, pose aksi; kartu ID; ikon project). Persen loader = jumlah pekerjaan yang benar-benar selesai / total (font + tiap gambar + 4 tahap di bawah), bukan angka palsu. Tampilan angka hanya dihaluskan (lerp), tidak pernah mendahului kemajuan asli.
2. **Lapisan GPU**: `will-change: transform, opacity` dipasang sementara pada lensa radar, kartu ID, tile kontak, kartu project, glow latar, kanvas debu, dan marquee. Isi halaman dirender penuh 2 frame di bawah tirai loader (`html.prewarming`), lalu `will-change` inline dilepas (`release()`, saat browser senggang). Yang memang selalu bergerak tetap memakai `will-change` dari stylesheet.
3. **Ukur sekali**: `measureNow()` memanggil semua `measure()` (radar, kartu ID, marquee, baris SplitText, parallax, latar). Sesudahnya pengukuran ulang hanya saat `resize` (didebounce 120 ms); pemicu `load` / `fonts.ready` dimatikan selama loader tampil.
4. **Animasi kering** (±300 ms, tak terlihat): probe hampir transparan menjalankan keyframe `rv-in` dan sapuan radar, dan tema dibalik-balik dalam satu tugas tanpa paint, supaya gaya dan raster kedua tema siap.
5. **Frame pertama + adaptif**: kanvas debu sudah tergambar di loader. Rata-rata dt rAF 20 frame (2 frame pemanasan dibuang) > 24 ms memasang `html.perf-lite`: partikel dikurangi, sorot kursor dan jaring kedua dimatikan, blur reveal dan bayangan foto dimatikan, lapisan parallax paling halus dilewati. Konten tidak pernah dihilangkan. Jumlah partikel awal juga menyesuaikan `devicePixelRatio` dan `hardwareConcurrency` / `deviceMemory`.

Loader selesai setelah tahap 1 sampai 5 (batas 6,5 dtk; pengaman 7 dtk di `<head>` tetap ada). Baru setelah itu `html.motion-ready` dipasang. Satu loop rAF bersama (`engine.ts`), listener pasif, berhenti saat tab tersembunyi; radar, kartu ID, marquee, dan gelombang teks berhenti menghitung saat jauh dari layar (IntersectionObserver). Catatan: `transform` identitas sengaja tidak dipaksakan pada elemen pemanasan karena akan menimpa transform inline milik radar / kartu ID / marquee; `will-change` + satu kali baca layout sudah cukup untuk membuat lapisan.

**Ganti tema**: `View Transitions API` bila ada (halaman baru memudar masuk di atas halaman lama, tanpa dip ke putih); bila tidak ada atau `perf-lite`, kelas sementara `html.theme-swap` (transisi warna 0,35 dtk, dicabut setelah 400 ms). Reduced motion: ganti langsung. Animasi reveal, posisi lensa radar, dan ayunan kartu ID tidak di-reset. Kedua varian visual (siluet merah/hitam, glow, jaring, debu) selalu ada di DOM dan hanya berganti opacity lewat token.

## Kunci zoom dan salin teks

- **Zoom**: `maximum-scale=1, user-scalable=no` di viewport, `touch-action: pan-x pan-y` pada `html`/`body`, dan `gesturestart/change/end` dibatalkan di `src/lib/lock.ts` (iOS Safari mengabaikan `user-scalable=no`). Zoom lewat menu browser desktop atau Ctrl+scroll tidak dikunci.
- **Teks**: `user-select: none` + `-webkit-touch-callout: none`, serta `selectstart`, `contextmenu` (klik kanan / tekan lama), `copy`, `cut`, `dragstart` dibatalkan. Kolom form tetap bisa diketik dan dipilih. Tombol "salin email" tetap jalan.
- Catatan: ini hanya pencegah kebiasaan. Teks tetap bisa diambil lewat lihat-sumber, mode baca, atau tangkapan layar. Mengunci zoom menyulitkan pembaca berpenglihatan rendah (WCAG 1.4.4). Untuk membatalkan: hapus `initLock()` di `Interact.astro`, aturan "Kunci zoom dan salin teks" di `base.css`, dan `maximum-scale=1, user-scalable=no` di `Base.astro`.

## Mengganti gambar OG (naikkan ?v=)

Gambar OG ada di `public/assets/og/og-default.jpg` (1200x630 JPEG, di bawah 200 KB; saat ini sekitar 105 KB). Isinya foto formal (cutout `profile-normal.webp`) dan tiga kotak angka dari data nyata `site.ts` (project, game, angkatan + kampus); prestasi / sertifikat baru ditampilkan bila `certificates` terisi. Setelah mengganti gambar, **naikkan angka `?v=` di `src/layouts/Base.astro`** (`new URL(asset('og/og-default.jpg'), site).href + '?v=3'` menjadi `?v=4`, dst.) agar WhatsApp / Google memuat ulang pratinjau. Teks alt OG memakai jumlah project dan game dari `stats` di `site.ts`.

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

- [ ] Pastikan tidak ada file lama tersisa: `src/styles/global.css` dan `public/assets/og/og-default.png` (di zip terakhir sudah tidak ada)
- [ ] `npm install` lalu commit `package-lock.json`
- [ ] Ganti foto dan ikon project
- [ ] Cek deskripsi bertanda `TODO` di `src/data/site.ts` (Bimtrack, "Berbasis di")
- [ ] Isi `certificates` bila ada (section tampil otomatis)
- [ ] Buka situs di handphone, tablet, laptop; coba ketiga tema
- [ ] Jalankan Lighthouse manual di Chrome (mode Incognito, tab Lighthouse, Mobile lalu Desktop) untuk **Performance**, **Accessibility**, **Best Practices**, dan **SEO**, di kedua tema. Catat skor dan perbaiki bila ada yang turun
- [ ] Uji di handphone sungguhan (Android dan iOS): tarik kartu ID, sentuh-geser foto, scroll cepat, putar layar

## Catatan pengujian (jujur)

Perubahan Fase 3 dan 4 **belum pernah dibangun dengan `npm run build` Astro** di lingkungan pengerjaan (tanpa akses npm). Pengujian memakai harness statis buatan sendiri di Chromium (Playwright): skrip klien dikompilasi dengan `tsc` (strict), markup komponen disalin ke satu halaman HTML, CSS asli dipakai apa adanya (font self-hosted tidak dimuat, jadi font cadangan yang tampil).

Fase 4, diuji lewat harness: render 360 dan 1280 px di kedua tema tanpa galat konsol dan tanpa overflow horizontal; loader dengan persen dari kemajuan nyata selesai sekitar 1,4 sampai 1,8 dtk di mesin uji, `motion-ready` dipasang sesudahnya, `will-change` sementara terlepas; ujung jarum radar tetap di dalam cincin terluar (3 sampel, 4 lensa); ganti tema 10x beruntun (View Transitions, fallback `theme-swap`, dan reduced motion) tanpa kedip putih, tanpa layout shift (CLS 0), tanpa galat, dengan reveal, lensa radar, dan ayunan kartu ID tetap hidup; `perf-lite` aktif saat CPU di-throttle 6x dan 12x dan konten tetap utuh; kunci salin (event `contextmenu`, `selectstart`, `copy`, `cut`, `dragstart`, pilih teks dengan mouse dan Ctrl+A, kontrol tanpa kunci terbukti bisa memilih teks), kolom form tetap bisa diketik, tombol salin email (jalur `navigator.clipboard` dan cadangan `execCommand`) tetap bekerja; tanpa JS dan reduced motion semua konten tetap terlihat.

**Tidak diuji**: build Astro; handphone sungguhan (tekan-lama asli, cubit-zoom, ketuk-ganda; Chromium headless tidak bisa mencubit-zoom bahkan di halaman biasa, jadi kunci zoom hanya diverifikasi secara struktur: meta viewport, `touch-action`, penangan gesture); Safari / Firefox / iOS; kehalusan scroll di perangkat nyata (hanya diuji tidak ada galat dan perf-lite aktif saat dibebani); Lighthouse; screen reader. Bila `npm run build` menampilkan galat, mulai dari sana.
