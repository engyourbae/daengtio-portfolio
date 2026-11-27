/**
 * Satu-satunya tempat mengedit konten. Komponen hanya membaca dari sini.
 * Link bisa diganti lewat GitHub Actions Variables (lihat README), tanpa menyentuh kode.
 */
import fs from 'node:fs';
import path from 'node:path';

const env = import.meta.env;
const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/* ---------- Path & aset ---------- */
const base = String(env.BASE_URL || '/').replace(/\/$/, '');
export const home = `${base}/`;
export const asset = (p: string): string => `${base}/assets/${p.replace(/^\//, '')}`;

const ASSET_DIR = path.join(process.cwd(), 'public', 'assets');
/**
 * Cari file aset berdasarkan nama tanpa ekstensi (urutan: webp, avif, png, jpg, svg).
 * Upload foto/ikon dengan nama yang benar dan situs memakainya otomatis, tanpa edit kode.
 */
export function findAsset(stem: string): string | null {
  for (const ext of ['webp', 'avif', 'png', 'jpg', 'jpeg', 'svg']) {
    if (fs.existsSync(path.join(ASSET_DIR, `${stem}.${ext}`))) return asset(`${stem}.${ext}`);
  }
  return null;
}

/* ---------- Identitas ---------- */
export const profile = {
  name: 'Daeng Tio Waldi',
  shortName: 'Daeng Tio',
  role: 'Freelance Web & Game Developer',
  headline: 'Saya membangun web dan game yang dipakai orang sungguhan.',
  intro:
    'Mahasiswa Manajemen Bisnis Syariah di Pontianak. Dari sistem kasir sampai game, saya merancang produk yang jelas manfaatnya dan nyaman dipakai.',
  available: true,
  availableLabel: 'Terbuka untuk freelance',
  email: clean(env.PUBLIC_CONTACT_EMAIL) || 'daengtiow@gmail.com',
  github: clean(env.PUBLIC_GITHUB_URL) || 'https://github.com/engyourbae',
  instagram: clean(env.PUBLIC_INSTAGRAM_URL) || 'https://instagram.com/daengtio_',
  formEndpoint: clean(env.PUBLIC_FORM_ENDPOINT),
  location: 'Pontianak',
  coords: '0°01′ LS, 109°20′ BT',
};

export const seo = {
  title: 'Daeng Tio Waldi | Web & Game Developer',
  description:
    'Portofolio Daeng Tio Waldi, mahasiswa Manajemen Bisnis Syariah dan freelance web & game developer di Pontianak. Terbuka untuk pekerjaan freelance.',
};

export const photos = {
  main: findAsset('profile/profile-main'),
  alt: findAsset('profile/profile-alt'),
  width: 800,
  height: 1069,
  altWidth: 900,
  altHeight: 984,
  altText: 'Foto Daeng Tio Waldi, separuh wajah berubah menjadi topeng Spider-Man hitam',
};

export const nav = [
  { label: 'Tentang', href: `${home}#tentang` },
  { label: 'Project', href: `${home}#project` },
  { label: 'Skill', href: `${home}#skill` },
  { label: 'Kontak', href: `${home}#kontak` },
];

/* ---------- Tentang ---------- */
export const about = {
  title: 'Bisnis dan kode, dari satu meja.',
  paragraphs: [
    'Saya Daeng Tio Waldi, mahasiswa Manajemen Bisnis Syariah di FEBI IAIN Pontianak (angkatan 2023). Di luar kelas, saya membuat aplikasi web dan game: sistem kasir toko, dasbor keuangan, aplikasi belajar, sampai situs kenangan angkatan.',
    'Latar belakang bisnis membuat saya terbiasa bertanya dulu: siapa yang akan memakai ini, dan masalah apa yang selesai? Baru setelah itu saya menulis kodenya.',
    'Saat ini saya menerima pekerjaan freelance untuk web dan game.',
  ],
  facts: [
    { term: 'Kampus', detail: 'FEBI IAIN Pontianak' },
    { term: 'Jurusan', detail: 'Manajemen Bisnis Syariah' },
    { term: 'Angkatan', detail: '2023' },
    { term: 'Berbasis di', detail: 'Pontianak' }, // TODO: ubah bila perlu
  ],
};

/* ---------- Project ---------- */
export interface Project {
  slug: string; // nama file ikon: public/assets/projects/<slug>.webp|png|svg
  title: string;
  desc: string;
  url: string; // kosong = tampil "Segera hadir"
  tags: string[];
  featured?: boolean;
  icon: string | null;
}

const mk = (x: Omit<Project, 'icon'>): Project => ({ ...x, icon: findAsset(`projects/${x.slug}`) });

export const projects: Project[] = [
  mk({
    slug: 'kasir-daeng',
    title: 'Kasir Daeng',
    desc: 'Sistem kasir toko berbasis web (PWA) dengan penyimpanan Supabase.',
    url: clean(env.PUBLIC_URL_KASIR_DAENG) || 'https://engyourbae.github.io/kasir-toko/',
    tags: ['PWA', 'JavaScript', 'Supabase'],
    featured: true,
  }),
  mk({
    slug: 'pintara',
    title: 'Pintara',
    desc: 'Aplikasi belajar dengan game Komik Pintar.',
    url: clean(env.PUBLIC_URL_PINTARA) || 'https://engyourbae.github.io/pintara/',
    tags: ['TypeScript', 'React'],
  }),
  mk({
    slug: 'duopop',
    title: 'DuoPop',
    desc: 'Game kuis pengetahuan berbahasa Indonesia.',
    url: clean(env.PUBLIC_URL_DUOPOP) || 'https://engyourbae.github.io/duopop-/',
    tags: ['Game', 'React', 'TypeScript'],
  }),
  mk({
    slug: 'financepay',
    title: 'FinancePay',
    desc: 'Dasbor keuangan berbasis web.',
    url: clean(env.PUBLIC_URL_FINANCEPAY) || 'https://engyourbae.github.io/finance-dashboard/',
    tags: ['Dashboard'],
  }),
  mk({
    slug: 'bimtrack',
    title: 'Bimtrack',
    desc: 'Aplikasi web.', // TODO: tulis deskripsi yang lebih spesifik
    url: clean(env.PUBLIC_URL_BIMTRACK) || 'https://engyourbae.github.io/Bimtrackk/',
    tags: ['Web App'],
  }),
  mk({
    slug: 'tidal-tales',
    title: 'Tidal Tales',
    desc: 'Game memancing yang berjalan di GitHub Pages.',
    url: clean(env.PUBLIC_URL_TIDAL_TALES) || 'https://engyourbae.github.io/tidal-tales/',
    tags: ['Game', 'JavaScript'],
  }),
  mk({
    slug: 'memory-mbs',
    title: 'Memory MBS 2023 A',
    desc: 'Situs kenangan angkatan 2023 A.',
    url: clean(env.PUBLIC_URL_MEMORY_MBS) || 'https://engyourbae.github.io/memory-mbs23-/',
    tags: ['Web'],
  }),
];

/* ---------- Skill ---------- */
export const skills = {
  title: 'Alat yang saya pakai sehari-hari.',
  groups: [
    { name: 'Bahasa', items: ['JavaScript', 'TypeScript', 'HTML', 'CSS'] },
    { name: 'Framework & Library', items: ['React', 'Astro', 'Three.js', 'Vite'] },
    { name: 'Backend & Tools', items: ['Supabase', 'GitHub Actions', 'GitHub Pages', 'PWA'] },
  ],
};

/* ---------- Sertifikat (section tampil hanya bila diisi) ---------- */
export interface Certificate { title: string; issuer: string; year: string; url?: string }
export const certificates: Certificate[] = [];
