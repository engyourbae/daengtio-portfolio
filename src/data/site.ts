/**
 * Satu-satunya tempat mengedit konten. Komponen hanya membaca dari sini.
 * Link bisa diganti lewat GitHub Actions Variables (lihat README), tanpa menyentuh kode.
 */
import fs from 'node:fs';
import path from 'node:path';

const env = import.meta.env;
const clean = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
/**
 * Bersihkan tautan: buang parameter pelacak (?_r, ?_t, ?lqvp, dst.) dan hash, buang "/" penutup.
 * Variable kosong atau tidak valid -> pakai nilai bawaan (wajib `||`, bukan `??`).
 */
const cleanUrl = (v: unknown, fallback: string): string => {
  const raw = clean(v) || fallback;
  try {
    const u = new URL(raw);
    u.search = '';
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return fallback;
  }
};

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
  shortName: 'Daeng Tio Waldi', // dipakai di header, loader, footer, dan manifest
  role: 'Freelance Web & Game Developer',
  headline: 'Saya membangun web dan game yang dipakai orang sungguhan.',
  intro:
    'Mahasiswa Manajemen Bisnis Syariah di Pontianak. Dari sistem kasir sampai game, saya merancang produk yang jelas manfaatnya dan nyaman dipakai.',
  available: true,
  availableLabel: 'Terbuka untuk freelance',
  email: clean(env.PUBLIC_CONTACT_EMAIL) || 'daengtiow@gmail.com',
  github: cleanUrl(env.PUBLIC_GITHUB_URL, 'https://github.com/engyourbae'),
  instagram: cleanUrl(env.PUBLIC_INSTAGRAM_URL, 'https://www.instagram.com/daengtio_'),
  tiktok: cleanUrl(env.PUBLIC_TIKTOK_URL, 'https://www.tiktok.com/@daengtio_0'),
  formEndpoint: clean(env.PUBLIC_FORM_ENDPOINT),
  location: 'Pontianak',
  coords: '0°01′ LS, 109°20′ BT',
};

/** Koordinat desimal, turunan dari `profile.coords` (0°01′ LS, 109°20′ BT) untuk meta geo. */
export const geo = { lat: -0.0167, lon: 109.3333 };

export const seo = {
  tagline: 'Merajut bisnis dan kode menjadi produk yang dipakai orang sungguhan.',
  keywords: [
    'Daeng Tio Waldi', 'web developer', 'game developer', 'freelance', 'portofolio', 'Pontianak',
    'Manajemen Bisnis Syariah', 'IAIN Pontianak', 'PWA', 'React', 'TypeScript', 'Astro',
  ],
  title: 'Portfolio Daeng Tio Waldi',
  description:
    'Portofolio Daeng Tio Waldi, mahasiswa Manajemen Bisnis Syariah di Pontianak. Karya, keahlian, dan cara menghubungi saya.',
};

/**
 * Foto profil. Semua file ada di public/assets/profile/ dan dicari otomatis lewat findAsset().
 *  - formal : potret formal berlatar biru (900 px). Dipakai di kartu ID, latar biru memang disengaja.
 *  - normal : potret formal yang sama, cutout transparan (hasil chroma-key biru). Kondisi diam di hero.
 *  - radar  : siluet Spider-Man yang tampak di dalam lensa radar. Varian `red` untuk tema terang,
 *             `black` untuk tema gelap. Tiap lapisan punya `fit` (persen terhadap bingkai formal 896x1196)
 *             supaya tersejajar sempurna dengan foto formal. Ganti foto? sesuaikan `fit` di sini, bukan di CSS.
 *  - action : pose aksi (klik / tap tahan di hero). Varian merah (terang) / hitam (gelap).
 * Ukuran width/height harus sama dengan ukuran asli file.
 */
const photo = (stem: string, width: number, height: number) => {
  const src = findAsset(stem);
  return src ? { src, width, height } : null;
};
/** rot = putar searah jarum jam (derajat) dengan poros di pojok kiri atas lapisan; hasil pencocokan wajah/rambut terhadap foto dasar. */
export interface Fit { left: number; top: number; width: number; rot?: number }
const layer = (stem: string, width: number, height: number, fit: Fit) => {
  const p = photo(stem, width, height);
  return p ? { ...p, fit } : null;
};
export const photos = {
  formal: photo('profile/profile-formal', 896, 1196),
  normal: photo('profile/profile-normal', 896, 1196),
  radar: {
    red: layer('profile/profile-hero-red', 900, 1203, { left: 0.982, top: 0.081, width: 99.038, rot: 0.445 }),
    black: layer('profile/profile-main', 800, 1069, { left: 1.113, top: 0.232, width: 99.011, rot: 0.492 }),
  },
  action: {
    red: photo('profile/profile-action', 1000, 1094),
    black: photo('profile/profile-alt', 900, 984),
  },
  /** Geometri lensa radar, pecahan dari lebar/tinggi bingkai formal. face = pusat wajah, patrol = jangkauan patroli saat idle. */
  lens: { face: { x: 0.57, y: 0.45 }, r: 0.21, patrol: { ax: 0.11, ay: 0.12 } },
  altText: 'Potret Daeng Tio Waldi',
  altFormal: 'Foto formal Daeng Tio Waldi berblazer biru',
};

/** Elemen dekoratif hero. Hanya merujuk bidang kerja yang memang ada di daftar project. */
export const hero = {
  accentWords: ['web', 'game'],
  chips: ['Web', 'Game', 'PWA'],
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
    featured: true,
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

/** Turunan dari data di atas (bukan data baru): dipakai counter di Tentang dan panel di Skill. */
export const stats = [
  { value: projects.length, label: 'Project' },
  { value: projects.filter((x) => x.tags.includes('Game')).length, label: 'Game' },
  { value: skills.groups.reduce((n, g) => n + g.items.length, 0), label: 'Alat & teknologi' },
];
/** Skill beserta project yang menandainya lewat tag (dicocokkan tanpa membedakan huruf). Tanpa level kemahiran. */
export const skillItems = skills.groups.flatMap((g, gi) =>
  g.items.map((name) => ({
    name,
    group: gi,
    groupName: g.name,
    usedIn: projects.filter((x) => x.tags.some((t) => t.toLowerCase() === name.toLowerCase())).map((x) => x.title),
  })),
);

/* ---------- Kontak & sosial ---------- */
const handleOf = (url: string): string => {
  try {
    const seg = new URL(url).pathname.split('/').filter(Boolean).pop() ?? '';
    return seg ? `@${seg.replace(/^@/, '')}` : url;
  } catch {
    return url;
  }
};
export interface Contact { id: 'gmail' | 'instagram' | 'tiktok' | 'github'; name: string; handle: string; href: string; external: boolean; cursor: string }
/** Satu kotak = satu tautan. Urutan di sini = urutan tampil. */
export const contacts: Contact[] = [
  { id: 'gmail', name: 'Gmail', handle: profile.email, href: `mailto:${profile.email}`, external: false, cursor: 'Kirim' },
  { id: 'instagram', name: 'Instagram', handle: handleOf(profile.instagram), href: profile.instagram, external: true, cursor: 'Buka' },
  { id: 'tiktok', name: 'TikTok', handle: handleOf(profile.tiktok), href: profile.tiktok, external: true, cursor: 'Buka' },
  { id: 'github', name: 'GitHub', handle: handleOf(profile.github), href: profile.github, external: true, cursor: 'Buka' },
];
export const socials = contacts.filter((c) => c.external);

/** Kartu ID di Tentang. Hanya memakai data di atas: tidak ada nomor ID atau data baru. */
export const idCard = {
  label: 'Kartu perkenalan',
  name: profile.name,
  role: profile.role,
  rows: about.facts, // Kampus, Jurusan, Angkatan, Berbasis di
};

/* ---------- Sertifikat (section tampil hanya bila diisi) ---------- */
export interface Certificate { title: string; issuer: string; year: string; url?: string }
export const certificates: Certificate[] = [];
