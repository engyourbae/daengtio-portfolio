import { defineConfig } from 'astro/config';

// Empty strings (unset GitHub Actions Variables) must fall back to defaults, so use || not ??.
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://engyourbae.github.io',
  base: process.env.BASE_PATH || '/daengtio-portfolio',
});
