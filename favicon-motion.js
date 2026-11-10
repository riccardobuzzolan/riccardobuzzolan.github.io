/* Smooth animated shark favicon. PNG frames ensure Chromium tab repaints. */
(() => {
  'use strict';
  const icon = document.querySelector('link[rel="icon"][data-favicon-motion]');
  if (!icon || !window.matchMedia || !window.fetch) return;
  const original = icon.getAttribute('href');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const blocked = () => document.hidden || reduced.matches || navigator.connection?.saveData === true;
  if (blocked()) return;
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
  const pulse = (t, c, w) => smooth(1 - Math.abs(t - c) / w);
  const count = 40;
  let frames = [], pos = 0, timer = null, ready = false, loading = false, stopped = false;

  async function makeFrames() {
    if (ready || loading || blocked() || stopped) return;
    loading = true;
    try {
      const response = await fetch(original, { cache: 'force-cache' });
      if (!response.ok) throw new Error('Favicon unavailable');
      const doc = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
      if (doc.querySelector('parsererror')) throw new Error('Invalid SVG');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      const build = i => {
        const t = i / (count - 1);
        const svg = doc.documentElement.cloneNode(true);
        const el = id => svg.querySelector('#' + id);
        const blink = Math.max(pulse(t, .23, .057), pulse(t, .65, .066));
        const breath = smooth(clamp((t - .1) / .33)) * (1 - smooth(clamp((t - .68) / .25)));
        const zoom = 1 + .065 * breath;
        el('shark').setAttribute('transform', 'translate(32 32) scale(' + zoom.toFixed(4) + ') translate(-32 -32)');
        el('white-left').setAttribute('ry', (7.6 * (1 - .94 * blink)).toFixed(3));
        el('white-right').setAttribute('ry', (6.3 * (1 - .94 * blink)).toFixed(3));
        for (const id of ['pupil-left','pupil-right','spark-left','spark-right'])
          el(id).setAttribute('opacity', (1 - smooth(blink)).toFixed(3));
        const base = [76, 206, 243], bright = [89, 217, 248];
        const color = '#' + base.map((v, k) => Math.round(v + (bright[k] - v) * breath).toString(16).padStart(2,'0')).join('');
        el('mid').setAttribute('stop-color', color);
        const xml = new XMLSerializer().serializeToString(svg);
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, 96, 96);
            ctx.drawImage(img, 0, 0, 96, 96);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
        });
      };
      frames = [];
      for (let i = 0; i < count; i++) frames.push(await build(i));
      if (!stopped) { ready = true; play(); }
    } catch { reset(); }
    finally { loading = false; }
  }
  function reset() {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pos = 0;
    icon.setAttribute('href', original);
  }
  function tick() {
    if (stopped || blocked()) { reset(); return; }
    if (pos === frames.length) {
      icon.setAttribute('href', original);
      pos = 0;
      timer = setTimeout(tick, 2350);
      return;
    }
    icon.setAttribute('href', frames[pos++]);
    timer = setTimeout(tick, 95);
  }
  function play() {
    if (!ready || blocked() || stopped) return;
    reset();
    timer = setTimeout(tick, 200);
  }
  function sync() {
    if (blocked()) reset();
    else if (ready) play();
    else makeFrames();
  }
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener?.('change', sync);
  window.addEventListener('pagehide', () => { stopped = true; reset(); }, { once: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', makeFrames, { once: true });
  else makeFrames();
})();
