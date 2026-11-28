/**
 * Mesin gerak bersama (Fase 3).
 * - SATU loop requestAnimationFrame untuk semua animasi JS (latar, marquee, kursor, radar, kartu ID, ...).
 * - SATU pembaca scroll (posisi, kecepatan yang di-damp, arah) dan SATU pembaca pointer.
 * - Loop berhenti saat tab tersembunyi dan saat tidak ada pelanggan. Semua listener `passive`.
 * Modul ini hanya menulis state; yang menulis ke DOM adalah pelanggan (transform / opacity / CSS variable).
 */

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Faktor lerp yang tidak bergantung frame rate. rate ~ 4 (lambat) sampai 20 (cepat). */
export const damp = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);

const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
export const reduced = (): boolean => mqReduce.matches;
export const finePointer = (): boolean => mqFine.matches;

const root = document.documentElement;

/** State bersama. Dibaca oleh semua modul; hanya engine yang menulisnya. */
export const S = {
  /** Scroll */
  y: 0,
  /** px/detik, sudah di-damp (momentum mengendap pelan setelah scroll berhenti). */
  vel: 0,
  /** vel dinormalisasi dan di-clamp ke -1..1 */
  velN: 0,
  /** 1 = turun, -1 = naik (arah terakhir yang bergerak) */
  dir: 1 as 1 | -1,
  vw: window.innerWidth,
  vh: window.innerHeight,
  /** Pointer (koordinat viewport) */
  px: -9999,
  py: -9999,
  pvx: 0,
  pvy: 0,
  ptype: 'mouse' as string,
  /** true selama jari/tombol menekan */
  down: false,
  /** true bila pointer mouse ada di dalam jendela, atau jari sedang menyentuh */
  active: false,
  /** detik sejak halaman dibuka */
  t: 0,
};

type Frame = (dt: number, t: number) => void;
const subs = new Set<Frame>();
let raf = 0;
let running = false;
let last = 0;
let lastY = window.scrollY;
let lastPx = -9999;
let lastPy = -9999;

root.dataset.dir = 'down';

function read(dt: number): void {
  const y = window.scrollY;
  const d = y - lastY;
  if (Math.abs(d) > 0.5) {
    const dir: 1 | -1 = d > 0 ? 1 : -1;
    if (dir !== S.dir) {
      S.dir = dir;
      root.dataset.dir = dir === 1 ? 'down' : 'up';
    }
  }
  S.vel += ((d / dt) - S.vel) * damp(9, dt);
  if (Math.abs(S.vel) < 1) S.vel = 0;
  S.velN = clamp(S.vel / 2400, -1, 1);
  S.y = y;
  lastY = y;

  if (lastPx > -9000) {
    S.pvx += (((S.px - lastPx) / dt) - S.pvx) * damp(14, dt);
    S.pvy += (((S.py - lastPy) / dt) - S.pvy) * damp(14, dt);
  } else {
    S.pvx = 0; S.pvy = 0;
  }
  lastPx = S.px;
  lastPy = S.py;
}

function frame(now: number): void {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  S.t = now / 1000;
  read(dt);
  subs.forEach((f) => f(dt, S.t));
}

function start(): void {
  if (running || document.hidden || subs.size === 0) return;
  running = true;
  last = performance.now();
  lastY = window.scrollY;
  raf = requestAnimationFrame(frame);
}
function stop(): void {
  running = false;
  cancelAnimationFrame(raf);
}

/** Daftarkan fungsi per-frame. Mengembalikan fungsi untuk berhenti. */
export function onFrame(fn: Frame): () => void {
  subs.add(fn);
  start();
  return () => {
    subs.delete(fn);
    if (subs.size === 0) stop();
  };
}

/** Tween singkat lewat loop bersama. step(k 0..1) dipanggil tiap frame; mengembalikan fungsi batal. */
export function tween(ms: number, step: (k: number) => void, done?: () => void): () => void {
  let el = 0;
  const off = onFrame((dt) => {
    el += dt * 1000;
    const k = Math.min(1, el / ms);
    step(k);
    if (k >= 1) { off(); done?.(); }
  });
  return off;
}

document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

/* ---------- Pointer ---------- */
window.addEventListener(
  'pointermove',
  (e) => {
    S.px = e.clientX;
    S.py = e.clientY;
    S.ptype = e.pointerType || 'mouse';
    if (S.ptype === 'mouse') S.active = true;
  },
  { passive: true },
);
window.addEventListener(
  'pointerdown',
  (e) => {
    S.px = e.clientX;
    S.py = e.clientY;
    S.ptype = e.pointerType || 'mouse';
    S.down = true;
    S.active = true;
    lastPx = S.px; lastPy = S.py;
  },
  { passive: true },
);
const up = (e: PointerEvent): void => {
  S.down = false;
  if ((e.pointerType || 'mouse') !== 'mouse') S.active = false;
};
window.addEventListener('pointerup', up, { passive: true });
window.addEventListener('pointercancel', up, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { S.active = false; }, { passive: true });

/* ---------- Ukuran ---------- */
const measureSubs = new Set<() => void>();
/** Dipanggil saat ukuran berubah (resize, font siap, halaman selesai dimuat). Sudah di-debounce. */
export function onMeasure(fn: () => void): void {
  measureSubs.add(fn);
}
let mt = 0;
const fireMeasure = (): void => {
  window.clearTimeout(mt);
  mt = window.setTimeout(() => {
    S.vw = window.innerWidth;
    S.vh = window.innerHeight;
    measureSubs.forEach((f) => f());
  }, 120);
};
window.addEventListener('resize', fireMeasure, { passive: true });
window.addEventListener('load', fireMeasure, { once: true });
void document.fonts?.ready.then(fireMeasure);

/* ---------- Reduced motion berubah saat halaman terbuka ---------- */
mqReduce.addEventListener?.('change', () => {
  if (mqReduce.matches) {
    root.classList.remove('motion');
    root.classList.add('is-reduced');
  }
});
if (mqReduce.matches) root.classList.add('is-reduced');
