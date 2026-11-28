import type { APIRoute } from 'astro';
import { asset, home, profile, seo } from '../data/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: `${profile.name} | Portofolio`,
      short_name: profile.shortName,
      description: seo.tagline,
      categories: ['portfolio', 'developer'],
      lang: 'id',
      start_url: home,
      scope: home,
      display: 'standalone',
      background_color: '#F7F2EC',
      theme_color: '#D0132A',
      icons: [
        { src: asset('brand/icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: asset('brand/icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: asset('brand/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
