const env = import.meta.env;
const base = (env.BASE_URL as string).replace(/\/$/, '');
export const asset = (p: string) => `${base}/assets/${p}`;

export const profile = {
  name: 'Daeng Tio Waldi',
  title: 'Mahasiswa · Freelance Web & Game Developer',
  headline: 'Membangun aplikasi web dan game yang benar-benar dipakai.',
  bio: 'Mahasiswa Manajemen Bisnis Syariah yang membangun aplikasi web dan game dari kebutuhan nyata: sistem kasir toko, dasbor keuangan, aplikasi belajar, hingga game. Saya memadukan sudut pandang bisnis dan pengembangan perangkat lunak agar produk mudah dipakai dan jelas manfaatnya. Terbuka untuk pekerjaan freelance.',
  email: (env.PUBLIC_CONTACT_EMAIL as string) || 'daengtiow@gmail.com',
  instagram: 'https://instagram.com/daengtio_',
  github: (env.PUBLIC_GITHUB_URL as string) || 'https://github.com/engyourbae',
  formEndpoint: (env.PUBLIC_FORM_ENDPOINT as string) || '',
  available: true,
};
export const education = [{ school: 'FEBI IAIN Pontianak', major: 'Manajemen Bisnis Syariah', note: 'Angkatan 2023' }];

export interface Project { title: string; desc?: string; logo?: string; url: string; featured?: boolean; tags: string[] }
export const projects: Project[] = [
  { title: 'Kasir Daeng', desc: 'Sistem kasir toko berbasis web (PWA) dengan penyimpanan Supabase.', logo: 'projects/kasir-daeng-logo.webp', url: 'https://engyourbae.github.io/kasir-toko/', featured: true, tags: ['PWA', 'JavaScript', 'Supabase'] },
  { title: 'Pintara', desc: 'Aplikasi belajar dengan game Komik Pintar.', logo: 'projects/pintara-logo.svg', url: 'https://engyourbae.github.io/pintara/', tags: ['TypeScript', 'React'] },
  { title: 'DuoPop', logo: 'projects/duopop-logo.webp', url: 'https://engyourbae.github.io/duopop-/', tags: ['Game'] },
  { title: 'FinancePay', desc: 'Dasbor keuangan.', logo: 'projects/financepay-logo.webp', url: 'https://engyourbae.github.io/finance-dashboard/', tags: ['Dashboard'] },
  { title: 'Bimtrack', logo: 'projects/bimtrack-logo.webp', url: 'https://engyourbae.github.io/Bimtrackk/', tags: ['Web App'] },
  { title: 'Tidal Tales', desc: 'Game memancing di GitHub Pages.', logo: 'projects/tidal-tales-logo.webp', url: 'https://engyourbae.github.io/tidal-tales/', tags: ['Game', 'JavaScript'] },
  { title: 'Memory MBS 2023 A', desc: 'Situs kenangan angkatan 2023 A.', logo: 'projects/memory-mbs-logo.webp', url: 'https://engyourbae.github.io/memory-mbs23-/', tags: ['Web'] },
];
export const skills = {
  Bahasa: ['JavaScript', 'TypeScript', 'HTML', 'CSS'],
  'Framework & Library': ['React', 'Astro', 'Three.js', 'Vite'],
  'Backend & Tools': ['Supabase', 'GitHub Actions', 'GitHub Pages', 'PWA'],
};
