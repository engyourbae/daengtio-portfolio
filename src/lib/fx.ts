/**
 * Interaksi sentuh dan hover untuk semua elemen (Fase 3).
 * - Mouse: CSS :hover, ditambah variabel --mx/--my dan tilt (data-tilt) yang mengikuti pointer.
 * - Sentuh / pena: kelas .is-touch dipasang pada elemen yang disentuh DAN yang dilewati jari saat menggeser
 *   (pointermove saat pointerdown, dites lewat elementFromPoint). Gayanya disamakan dengan :hover di CSS.
 * - Fokus keyboard: CSS memakai :focus-visible dengan gaya yang sama.
 * - Kursor titik + cincin dengan label konteks, hanya untuk pointer halus (mouse) dan bukan reduced-motion.
 * Elemen visual interaktif memakai touch-action: pan-y di CSS supaya scroll vertikal tetap jalan.
 */
import { S, clamp, damp, finePointer, onFrame, reduced } from './engine';

/** Semua elemen terlihat yang punya respons. Satu daftar, satu aturan. */
const FX = [
  '.btn', '.chip', '.tab', '.tags li', '.pcard', '.feature', '.stat', '.facts > div', '.proj-icon', '.divider',
  '.menu a', '.brand', '.theme button', '.totop', '.site-footer__nav a', '.site-footer__social a', '.field',
  '.certs li', '.tile', '.copy', '.badge', '.stage__chips li', '.eyebrow', '.about__text p', '.sec-head p',
  '.hero__intro', '.hero__place', '.skills__panel', '.photo', '.idc__card', '.marquee', '.site-footer__row span',
  '.form__status', '.skip', '.menu-toggle', '.contact__label', '.copy__tip', '[data-fx]',
].join(',');

export function initFx(): void {
  const root = document.documentElement;
  const reduce = reduced();

  /* ---------- Penanda sentuh / tilt ---------- */
  const timers = new Map<Element, number>();
  const live = new Set<Element>();
  let hoverEl: Element | null = null;
  let evt: { x: number; y: number; type: string; target: EventTarget | null } | null = null;

  const vars = (el: Element, x: number, y: number): void => {
    const h = el as HTMLElement;
    const r = h.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    const px = clamp((x - r.left) / r.width, 0, 1);
    const py = clamp((y - r.top) / r.height, 0, 1);
    h.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    h.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    if (!reduce && h.hasAttribute('data-tilt')) {
      h.style.setProperty('--ry', `${((px - 0.5) * 10).toFixed(2)}deg`);
      h.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`);
    }
  };
  const reset = (el: Element): void => {
    const h = el as HTMLElement;
    h.style.removeProperty('--rx');
    h.style.removeProperty('--ry');
  };
  const addTouch = (el: Element): void => {
    const t = timers.get(el);
    if (t) { window.clearTimeout(t); timers.delete(el); }
    el.classList.add('is-touch');
    live.add(el);
  };
  const dropTouch = (el: Element, delay: number): void => {
    const old = timers.get(el);
    if (old) window.clearTimeout(old);
    timers.set(el, window.setTimeout(() => {
      el.classList.remove('is-touch');
      reset(el);
      live.delete(el);
      timers.delete(el);
    }, delay));
  };
  const find = (n: EventTarget | null): Element | null => (n instanceof Element ? n.closest(FX) : null);

  const onMove = (e: PointerEvent): void => {
    evt = { x: e.clientX, y: e.clientY, type: e.pointerType, target: e.target };
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onMove, { passive: true });
  const release = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse') return;
    live.forEach((el) => dropTouch(el, 650));
    evt = null;
  };
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  document.addEventListener('pointerleave', () => { if (hoverEl) { reset(hoverEl); hoverEl = null; } });

  // Fokus keyboard memberi variabel yang setara (pusat elemen).
  document.addEventListener('focusin', (e) => {
    const el = find(e.target);
    if (!el || !(e.target as HTMLElement).matches?.(':focus-visible')) return;
    const r = el.getBoundingClientRect();
    vars(el, r.left + r.width / 2, r.top + r.height * 0.4);
  });

  onFrame(() => {
    if (!evt) return;
    const e = evt;
    evt = null;
    if (e.type === 'mouse') {
      const el = find(e.target);
      if (el !== hoverEl) {
        if (hoverEl) reset(hoverEl);
        hoverEl = el;
      }
      if (el) vars(el, e.x, e.y);
      return;
    }
    // Sentuh / pena: hanya saat menekan. Jari yang menggeser berpindah dari elemen ke elemen.
    if (!S.down) return;
    const under = document.elementFromPoint(e.x, e.y);
    const el = find(under);
    live.forEach((x) => { if (x !== el && !timers.has(x)) dropTouch(x, 450); });
    if (el) { addTouch(el); vars(el, e.x, e.y); }
  });

  /* ---------- Tombol magnetik (mouse) ---------- */
  if (finePointer() && !reduce) {
    document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--tx', `${((e.clientX - (r.left + r.width / 2)) * 0.22).toFixed(1)}px`);
        el.style.setProperty('--ty', `${((e.clientY - (r.top + r.height / 2)) * 0.3).toFixed(1)}px`);
      });
      el.addEventListener('pointerleave', () => { el.style.removeProperty('--tx'); el.style.removeProperty('--ty'); });
    });
  }

  /* ---------- Kursor: titik + cincin + label konteks ---------- */
  const cur = document.querySelector<HTMLElement>('.cursor');
  if (cur && finePointer() && !reduce) {
    const ring = cur.querySelector<HTMLElement>('.cursor__ring')!;
    const dot = cur.querySelector<HTMLElement>('.cursor__dot')!;
    const label = cur.querySelector<HTMLElement>('.cursor__label')!;
    root.classList.add('has-cursor');
    let x = -200; let y = -200; let rs = 1; let state = ''; let text = '';
    const INTERACTIVE = '[data-cursor],a,button,input,textarea,select,label,[data-tilt],.photo,.idc__card';
    const pick = (e: PointerEvent): void => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target instanceof Element ? e.target.closest<HTMLElement>(INTERACTIVE) : null;
      const lab = t?.dataset.cursor ?? '';
      const st = !t ? '' : t.matches('input,textarea') ? 'text' : lab ? 'label' : 'link';
      if (st !== state) { state = st; cur.dataset.state = st; }
      if (lab !== text) { text = lab; label.textContent = lab; }
    };
    window.addEventListener('pointermove', pick, { passive: true });
    window.addEventListener('pointerover', pick, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') cur.classList.add('is-on'); }, { passive: true });
    window.addEventListener('pointerdown', () => cur.classList.add('is-press'), { passive: true });
    window.addEventListener('pointerup', () => cur.classList.remove('is-press'), { passive: true });
    onFrame((dt) => {
      if (S.px < -1000) return;
      if (x < -150) { x = S.px; y = S.py; }
      const f = damp(16, dt);
      x += (S.px - x) * f; y += (S.py - y) * f;
      const dx = S.px - x; const dy = S.py - y;
      const sp = Math.hypot(dx, dy);
      const stretch = clamp(sp / 70, 0, 0.55);
      const ang = Math.atan2(dy, dx);
      const target = state === 'label' ? 2.5 : state === 'link' ? 1.7 : state === 'text' ? 0.5 : 1;
      rs += (target - rs) * damp(14, dt);
      ring.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${ang.toFixed(3)}rad) scale(${(rs * (1 + stretch)).toFixed(3)},${(rs * (1 - stretch * 0.42)).toFixed(3)})`;
      dot.style.transform = `translate3d(${S.px.toFixed(1)}px,${S.py.toFixed(1)}px,0)`;
      label.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  }
}
