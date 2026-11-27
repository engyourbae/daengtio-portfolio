import { defineConfig } from 'astro/config';
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://engyourbae.github.io',
  base: process.env.BASE_PATH ?? '/daengtio-portfolio',
});
