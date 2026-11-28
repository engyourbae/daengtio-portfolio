/**
 * Animasi scroll. Semuanya memakai engine bersama (satu rAF) dan aman bila JS gagal:
 * konten hanya disembunyikan oleh CSS bila <html class="motion"> (dipasang skrip di <head>, dicabut bila skrip ini gagal).
 */
import { S, clamp, damp, onFrame, onMeasure, reduced, tween } from './engine';

const root = document.documentElement;

/* ================= Reveal dua arah ================= */
/**
 * Elemen [data-reveal] mendapat .is-in saat masuk viewport dan kehilangannya saat benar-benar keluar.
 * Histeresis: masuk diamati pada batas 6% dari bawah, keluar baru dicabut setelah 14% di luar layar,
 * sehingga tidak berkedip di tepi. Animasi berjalan lagi tiap kali elemen masuk, turun maupun naik.
 * Arah masuk mengikuti html[data-dir] (lihat CSS: --sy).
 */
export function initReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (reduced() || !('IntersectionObserver' in window) || items.length === 0) {
    root.classList.remove('motion');
    root.classList.add('motion-ready');
    return;
  }
  root.classList.add('motion', 'motion-ready');

  const pending = new Set<HTMLElement>();
  const settleT = new Map<HTMLElement, number>();
  // Teks pecahan: setelah animasi masuk selesai, mask dilepas (is-settled) supaya gelombang tidak terpotong.
  const settle = (el: HTMLElement, on: boolean): void => {
    const old = settleT.get(el);
    if (old) window.clearTimeout(old);
    settleT.delete(el);
    if (!el.hasAttribute('data-split')) return;
    if (!on) { el.classList.remove('is-settled'); return; }
    const n = el.querySelectorAll('.st-c').length;
    settleT.set(el, window.setTimeout(() => el.classList.add('is-settled'), 1000 + Math.min(1700, n * 24)));
  };
  const fire = (el: HTMLElement, isIn: boolean): void => {
    el.dispatchEvent(new CustomEvent('reveal', { detail: { in: isIn } }));
  };
  const show = (el: HTMLElement): void => {
    if (root.classList.contains('loading')) { pending.add(el); return; }
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in');
    settle(el, true);
    fire(el, true);
  };
  const hide = (el: HTMLElement): void => {
    pending.delete(el);
    if (!el.classList.contains('is-in')) return;
    el.classList.remove('is-in');
    settle(el, false);
    fire(el, false);
  };

  const enter = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting && (e.intersectionRatio >= 0.1 || e.intersectionRect.height >= S.vh * 0.22)) show(e.target as HTMLElement);
    }),
    { rootMargin: '0px 0px -6% 0px', threshold: [0, 0.1, 0.25] },
  );
  const leave = new IntersectionObserver(
    (es) => es.forEach((e) => { if (!e.isIntersecting) hide(e.target as HTMLElement); }),
    { rootMargin: '14% 0px 14% 0px', threshold: 0 },
  );
  items.forEach((el) => { enter.observe(el); leave.observe(el); });

  // Loader masih tampil: tahan, lalu lepas semuanya saat halaman terbuka.
  if (root.classList.contains('loading')) {
    const mo = new MutationObserver(() => {
      if (root.classList.contains('loading')) return;
      mo.disconnect();
      pending.forEach((el) => show(el));
      pending.clear();
      items.forEach((el) => { enter.unobserve(el); enter.observe(el); });
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
}

/* ================= Counter (menghitung ulang tiap masuk) ================= */
export function initCounters(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count]'));
  if (reduced() || els.length === 0) return;
  els.forEach((el) => {
    const to = Number(el.dataset.count) || 0;
    const host = (el.closest('[data-reveal]') as HTMLElement | null) ?? el;
    let off: (() => void) | null = null;
    host.addEventListener('reveal', (ev) => {
      const isIn = Boolean((ev as CustomEvent).detail?.in);
      off?.();
      if (isIn) {
        el.textContent = '0';
        off = tween(1100, (k) => { el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3)))); });
      } else {
        el.textContent = '0';
      }
    });
  });
}

/* ================= Parallax: data-parallax="0.15" ================= */
interface Par { el: HTMLElement; k: number; mid: number; cur: number }
export function initParallax(): void {
  if (reduced()) return;
  const list: Par[] = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]')).map((el) => ({
    el, k: parseFloat(el.dataset.parallax || '0.1') || 0.1, mid: 0, cur: 0,
  }));
  if (list.length === 0) return;
  const measure = (): void => {
    const sy = window.scrollY;
    list.forEach((p) => {
      const r = p.el.getBoundingClientRect();
      p.mid = r.top + sy + r.height / 2 - p.cur;
    });
  };
  measure();
  onMeasure(measure);
  onFrame((dt) => {
    const vc = S.y + S.vh / 2;
    const f = damp(7, dt);
    for (const p of list) {
      const d = p.mid - vc;
      if (Math.abs(d) > S.vh * 1.3) continue;
      const target = clamp(-d * p.k, -140, 140);
      const next = p.cur + (target - p.cur) * f;
      if (Math.abs(next - p.cur) < 0.04) continue;
      p.cur = next;
      p.el.style.setProperty('--py', `${next.toFixed(1)}px`);
    }
  });
}

/* ================= Marquee: kecepatan mengikuti scroll, berbalik saat scroll naik ================= */
export function initMarquee(): void {
  const wraps = Array.from(document.querySelectorAll<HTMLElement>('.marquee'));
  if (reduced() || wraps.length === 0) return;
  interface M { el: HTMLElement; track: HTMLElement; half: number; x: number; sign: number; hold: number; hover: boolean; vis: boolean; base: number }
  const ms: M[] = wraps.map((el) => ({
    el, track: el.querySelector<HTMLElement>('.marquee__track')!, half: 1, x: 0, sign: 1, hold: 1, hover: false, vis: true,
    base: 70 * (Number(el.dataset.speed) || 1),
  }));
  const measure = (): void => ms.forEach((m) => { m.half = Math.max(1, m.track.scrollWidth / 2); });
  measure();
  onMeasure(measure);
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const m = ms.find((x) => x.el === e.target);
    if (m) m.vis = e.isIntersecting;
  }));
  ms.forEach((m) => {
    m.el.classList.add('is-js');
    io.observe(m.el);
    m.el.addEventListener('pointerenter', () => { m.hover = true; });
    m.el.addEventListener('pointerleave', () => { m.hover = false; });
    m.el.addEventListener('pointerdown', () => { m.hover = true; });
    m.el.addEventListener('pointerup', () => { window.setTimeout(() => { m.hover = false; }, 500); });
  });
  onFrame((dt) => {
    for (const m of ms) {
      if (!m.vis) continue;
      m.sign += (S.dir - m.sign) * damp(3.2, dt); // berbalik arah dengan mulus, melewati nol
      m.hold += ((m.hover ? 0.18 : 1) - m.hold) * damp(6, dt);
      const boost = 1 + Math.min(7, Math.abs(S.vel) / 320);
      m.x -= m.sign * m.base * boost * m.hold * dt;
      if (m.x <= -m.half) m.x += m.half; else if (m.x > 0) m.x -= m.half;
      m.track.style.transform = `translate3d(${m.x.toFixed(1)}px,0,0)`;
    }
  });
}

/* ================= Judul miring tipis mengikuti kecepatan scroll (--vel) ================= */
export function initSkew(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-skew]'));
  if (reduced() || els.length === 0) return;
  const vis = new Set<HTMLElement>();
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) vis.add(e.target as HTMLElement); else { vis.delete(e.target as HTMLElement); (e.target as HTMLElement).style.setProperty('--vel', '0'); }
  }));
  els.forEach((el) => io.observe(el));
  let prev = 0;
  onFrame(() => {
    const v = Math.round(S.velN * 200) / 200;
    if (v === prev) return;
    prev = v;
    vis.forEach((el) => el.style.setProperty('--vel', String(v)));
  });
}

/* ================= SplitText mode baris: kelompokkan kata per baris ================= */
export function initLines(): void {
  const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-split="line"]'));
  if (hosts.length === 0) return;
  const run = (): void => {
    const reads = hosts.map((h) => Array.from(h.querySelectorAll<HTMLElement>('.st-w')).map((w) => w.offsetTop));
    hosts.forEach((h, i) => {
      const tops = reads[i];
      let line = -1; let lastTop = -9999;
      h.querySelectorAll<HTMLElement>('.st-w').forEach((w, j) => {
        if (Math.abs(tops[j] - lastTop) > 4) { line += 1; lastTop = tops[j]; }
        w.style.setProperty('--l', String(line));
      });
    });
  };
  run();
  onMeasure(run);
}

/* ================= Gelombang teks: [data-wave] bereaksi pada jarak pointer / jari ================= */
interface Ch { el: HTMLElement; cx: number; cy: number; wy: number; wr: number; ws: number; on: boolean }
interface Wv { host: HTMLElement; chars: Ch[]; fs: number; reach: number; live: boolean; vis: boolean; measured: boolean; left: number; top: number; w: number; h: number }
export function initWave(): void {
  const hosts = Array.from(document.querySelectorAll<HTMLElement>('[data-wave]'));
  if (reduced() || hosts.length === 0) return;
  const ws: Wv[] = hosts.map((host) => ({
    host, chars: Array.from(host.querySelectorAll<HTMLElement>('.st-c')).map((el) => ({ el, cx: 0, cy: 0, wy: 0, wr: 0, ws: 1, on: false })),
    fs: 16, reach: 120, live: false, vis: false, measured: false, left: 0, top: 0, w: 0, h: 0,
  }));
  const measure = (w: Wv): void => {
    // offset* mengabaikan transform, jadi aman walau reveal sedang berjalan
    const r = w.host.getBoundingClientRect();
    w.left = r.left + window.scrollX; w.top = r.top + window.scrollY; w.w = r.width; w.h = r.height;
    w.fs = parseFloat(getComputedStyle(w.host).fontSize) || 16;
    w.reach = clamp(w.fs * 3.4, 90, 280);
    w.chars.forEach((c) => {
      const word = c.el.parentElement as HTMLElement;
      c.cx = w.left + word.offsetLeft + c.el.offsetLeft + c.el.offsetWidth / 2;
      c.cy = w.top + word.offsetTop + c.el.offsetTop + c.el.offsetHeight / 2;
    });
    w.measured = true;
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const w = ws.find((x) => x.host === e.target);
    if (!w) return;
    w.vis = e.isIntersecting;
    if (w.vis && !w.measured) measure(w);
  }), { rootMargin: '80px' });
  ws.forEach((w) => io.observe(w.host));
  onMeasure(() => ws.forEach((w) => { if (w.vis) measure(w); else w.measured = false; }));

  onFrame((dt) => {
    const pointerOn = S.active && (S.ptype === 'mouse' || S.down);
    const px = S.px + window.scrollX;
    const py = S.py + S.y;
    const f = damp(13, dt);
    for (const w of ws) {
      if (!w.vis) continue;
      const near = pointerOn && px > w.left - w.reach && px < w.left + w.w + w.reach && py > w.top - w.reach && py < w.top + w.h + w.reach;
      if (!near && !w.live) continue;
      let moving = false;
      for (const c of w.chars) {
        let ty = 0; let tr = 0; let ts = 1;
        if (near) {
          const dx = px - c.cx; const dy = py - c.cy;
          const g = Math.max(0, 1 - Math.hypot(dx, dy) / w.reach);
          const k = g * g * (3 - 2 * g);
          ty = -k * w.fs * 0.3;
          tr = clamp(dx / w.reach, -1, 1) * k * 12;
          ts = 1 + k * 0.2;
        }
        c.wy += (ty - c.wy) * f; c.wr += (tr - c.wr) * f; c.ws += (ts - c.ws) * f;
        const rest = Math.abs(c.wy) < 0.05 && Math.abs(c.wr) < 0.05 && Math.abs(c.ws - 1) < 0.002;
        if (rest) {
          if (c.on) { c.el.style.transform = ''; c.on = false; }
        } else {
          moving = true; c.on = true;
          c.el.style.transform = `translate3d(0,${c.wy.toFixed(2)}px,0) rotate(${c.wr.toFixed(2)}deg) scale(${c.ws.toFixed(3)})`;
        }
      }
      w.live = moving;
    }
  });
}
