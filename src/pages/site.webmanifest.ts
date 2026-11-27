import type { APIRoute } from 'astro';
import { asset, home, profile } from '../data/site';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: `${profile.name} | Portofolio`,
      short_name: profile.shortName,
      description: 'Portofolio web & game developer.',
      lang: 'id',
      start_url: home,
      scope: home,
      display: 'standalone',
      background_color: '#EFF3EE',
      theme_color: '#071A1B',
      icons: [
        { src: asset('brand/icon-192.png'), sizes: '192x192', type: 'image/png' },
        { src: asset('brand/icon-512.png'), sizes: '512x512', type: 'image/png' },
        { src: asset('brand/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
