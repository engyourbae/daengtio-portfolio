import type { APIRoute } from 'astro';
import { home } from '../data/site';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://engyourbae.github.io');
  const loc = new URL(home, origin).href;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${loc}</loc></url>\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
