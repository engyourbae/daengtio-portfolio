# Portofolio Daeng Tio Waldi
Astro + TypeScript, statis, deploy ke GitHub Pages.

## Jalankan lokal
`npm install` lalu `npm run dev`. Build: `npm run build`. Workflow GitHub Actions saat ini memakai `npm install` karena repository belum menyertakan `package-lock.json`. Untuk instalasi yang reproducible, jalankan `npm install` secara lokal lalu commit `package-lock.json`; setelah file itu tersedia, workflow dapat dikembalikan menggunakan `npm ci` dan cache npm.

## Ubah konten
Semua teks, project, dan skill ada di `src/data/site.ts`. Aset di `public/assets/`:
- Foto: `profile/profile-main.webp` (asli), `profile-hero-red.webp` (tema terang), `profile-hero-black.webp` (tema gelap). Ukuran sama (3:4), ganti dengan nama sama.
- Project: tambah objek di `projects` + logo di `projects/`. Tanpa logo, tampil inisial.

## Deploy
1. Buat repo `daengtio-portfolio`, push ke `main`.
2. Settings → Pages → Source: GitHub Actions.
3. Settings → Secrets and variables → Actions → **Variables** (bukan Secrets, semuanya publik): `PUBLIC_SITE_URL`, `BASE_PATH` (`/daengtio-portfolio`), `PUBLIC_CONTACT_EMAIL`, `PUBLIC_GITHUB_URL`, `PUBLIC_FORM_ENDPOINT` (endpoint Formspree/Web3Forms; kosong = form disembunyikan). Semua opsional.
Jika repo bernama `engyourbae.github.io`, set `BASE_PATH` ke `/`.
