/**
 * Prewarm (Fase 4): semua kerja berat dipindah ke layar loader supaya sesudahnya ringan.
 * Dipanggil sekali oleh Loader.astro. Urutan:
 *   1. aset     : font siap + decode semua gambar kritis (kemajuan = jumlah yang benar-benar selesai)
 *   2. lapisan  : will-change sementara + render penuh di bawah tirai loader, paksa satu kali komposit
 *   3. ukur     : semua measure() sekali (radar, kartu ID, marquee, baris SplitText, parallax, latar)
 *   4. animasi  : putaran kering tak terlihat (keyframe reveal, sapuan radar, ganti tema) supaya gaya + raster siap
 *   5. frame    : satu frame pertama kanvas debu, plus pengukuran adaptif (20 frame -> html.perf-lite)
 * Tidak ada angka palsu: onStep(selesai, total) dihitung dari pekerjaan yang benar-benar selesai.
 */
import { measureNow, onFrame } from './engine';

const root = document.documentElement;

/** Gambar yang dipakai persis saat halaman pertama dibuka: hero (foto, siluet, pose aksi), kartu ID, ikon project. */
const CRITICAL_IMG = '[data-photo] img, .idc img, .proj-icon img';
/** Elemen yang nanti beranimasi. will-change dipasang hanya selama loader, lalu dilepas (release). */
const WARM = '.radar__lens, .radar__hud, .idc__body, .tile, .pcard, .feature, .bd--glow, .backdrop__dust, .marquee__track';

const raf = (): Promise<void> => new Promise((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));

/** Kerjakan saat browser senggang (fallback setTimeout). Untuk pekerjaan yang tidak kritis. */
export function idle(fn: () => void, timeout = 2000): void {
  const w: Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number } = window;
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(fn, { timeout });
  else window.setTimeout(fn, 250);
}

const decodeImg = async (img: HTMLImageElement): Promise<void> => {
  try {
    if (img.loading === 'lazy') img.loading = 'eager'; // lazy tidak mau mulai memuat di luar layar
    await img.decode();
  } catch {
    /* gambar rusak / dibatalkan: lanjut, jangan menahan loader */
  }
};

/** Rata-rata dt rAF pada 20 frame (2 frame pertama dibuang sebagai pemanasan). > 24 ms = perangkat berat. */
const measureLoad = (): Promise<void> =>
  new Promise((resolve) => {
    let n = 0;
    let sum = 0;
    const reset = (): void => { n = 0; sum = 0; }; // tab sempat tersembunyi: ulang, dt pertama setelahnya tidak adil
    document.addEventListener('visibilitychange', reset);
    const off = onFrame((dt) => {
      n += 1;
      if (n <= 2) return;
      sum += dt;
      if (n < 22) return;
      off();
      document.removeEventListener('visibilitychange', reset);
      if ((sum / 20) * 1000 > 24) {
        root.classList.add('perf-lite');
        measureNow(); // partikel dihitung ulang dengan mode ringan
      }
      resolve();
    });
  });

/** Putaran kering di bawah tirai loader: probe hampir transparan menjalankan keyframe yang sama dengan yang dipakai nanti. */
const dryRun = async (): Promise<void> => {
  const probe = document.createElement('div');
  probe.className = 'pw-probe';
  probe.setAttribute('aria-hidden', 'true');
  probe.innerHTML =
    '<i data-reveal="up" class="is-in"></i>' +
    '<span class="radar is-ping"><svg viewBox="-50 -50 100 100" fill="none" stroke="currentColor" focusable="false">' +
    '<circle class="radar__ping" r="46" stroke-width="1.2"/>' +
    '<g class="radar__sweep"><circle r="47.5" stroke="none"/><path d="M0 0V-47" stroke-width="1.1"/></g></svg></span>';
  document.body.appendChild(probe);

  // Ganti tema bolak-balik dalam satu tugas (tanpa paint di antaranya): gaya kedua tema terhitung sekali, tanpa kedip.
  const cur = root.dataset.theme || 'terang';
  root.dataset.theme = cur === 'gelap' ? 'terang' : 'gelap';
  void document.body.offsetHeight;
  root.dataset.theme = cur;
  void document.body.offsetHeight;

  await sleep(300);
  probe.remove();
};

/** Lepas will-change inline yang dipasang prewarm. Nilai dari stylesheet (elemen yang memang terus bergerak) tetap berlaku. */
export function release(): void {
  document.querySelectorAll<HTMLElement>(WARM).forEach((el) => { el.style.willChange = ''; });
}

export async function prewarm(onStep: (done: number, total: number) => void): Promise<void> {
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>(CRITICAL_IMG));
  const total = 1 + imgs.length + 4;
  let done = 0;
  const step = (): void => { done += 1; onStep(done, total); };
  onStep(0, total);

  /* 1. Aset */
  const fonts = Promise.all([
    document.fonts?.ready,
    document.fonts?.load('400 1em Anton'),
    document.fonts?.load('400 1em "Instrument Sans Variable"'),
  ]).catch(() => undefined);
  await Promise.all([fonts.then(step), ...imgs.map((img) => decodeImg(img).then(step))]);

  // Semua skrip modul (radar, kartu ID, motion, ...) sudah berjalan setelah event load.
  if (document.readyState !== 'complete') await new Promise<void>((r) => window.addEventListener('load', () => r(), { once: true }));

  /* 2. Lapisan GPU: render penuh sebentar di bawah tirai loader, lalu kembalikan */
  const warm = Array.from(document.querySelectorAll<HTMLElement>(WARM));
  warm.forEach((el) => { el.style.willChange = 'transform, opacity'; });
  root.classList.add('prewarming');
  warm.forEach((el) => el.getBoundingClientRect()); // paksa gaya + layout satu kali
  await raf();
  await raf(); // satu frame paint + komposit penuh
  root.classList.remove('prewarming');
  step();

  /* 3. Ukur sekali (selanjutnya hanya saat resize, didebounce oleh engine) */
  measureNow();
  step();

  /* 4. Animasi kering + 5. frame pertama dan pengukuran beban, berjalan bersamaan */
  const load = measureLoad();
  await dryRun();
  step();
  await Promise.all([raf(), load]);
  step();
}
