import { defineConfig } from 'astro/config';

// Variable GitHub Actions yang belum diisi menjadi string kosong.
// Karena itu wajib memakai || (bukan ??) supaya fallback tetap terpakai.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://engyourbae.github.io',
  base: process.env.BASE_PATH || '/daengtio-portfolio',
  devToolbar: { enabled: false },
});
