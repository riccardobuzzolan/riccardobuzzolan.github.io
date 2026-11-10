/* Animated hammerhead shark favicon. Static PNG is always the fallback. */
(() => {
  'use strict';

  const icon = document.querySelector('link[rel="icon"][data-favicon-motion]');
  if (!icon || !window.matchMedia) return;

  const original = icon.getAttribute('href');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const blocked = () =>
    document.hidden || reduced.matches || navigator.connection?.saveData === true;

  const frameCount = 36;
  const frameDelay = 90;
  let frames = [];
  let position = 0;
  let timer = null;
  let preparing = false;
  let ready = false;
  let disposed = false;

  function stop() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    position = 0;
    icon.setAttribute('href', original);
  }

  function tick() {
    if (disposed || blocked()) {
      stop();
      return;
    }
    if (position >= frames.length) {
      icon.setAttribute('href', original);
      position = 0;
      timer = window.setTimeout(tick, 2200);
      return;
    }
    icon.setAttribute('href', frames[position]);
    position += 1;
    timer = window.setTimeout(tick, frameDelay);
  }

  function play() {
    if (disposed || blocked() || !ready) return;
    stop();
    timer = window.setTimeout(tick, 130);
  }

  async function prepare() {
    if (disposed || blocked() || preparing || ready) return;
    preparing = true;
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = original;
      await image.decode();
      if (disposed) return;

      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 96;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) throw new Error('Canvas unavailable');

      const nextFrames = [];
      for (let i = 0; i < frameCount; i += 1) {
        const t = (2 * Math.PI * i) / frameCount;
        const wave = Math.sin(t);
        context.clearRect(0, 0, 96, 96);
        context.save();
        context.translate(48 + wave * 1.7, 48 + Math.cos(t) * 0.8);
        context.rotate((Math.PI / 180) * (Math.sin(t - 0.5) * 4));
        const size = 1.015 + 0.015 * Math.cos(t);
        context.scale(size, size);
        context.drawImage(image, -48, -48, 96, 96);
        context.restore();
        nextFrames.push(canvas.toDataURL('image/png'));
      }
      frames = nextFrames;
      ready = true;
      play();
    } catch {
      stop();
    } finally {
      preparing = false;
    }
  }

  function sync() {
    if (blocked()) stop();
    else if (ready) play();
    else prepare();
  }

  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener?.('change', sync);
  window.addEventListener('pagehide', () => {
    disposed = true;
    stop();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepare, { once: true });
  } else {
    prepare();
  }
})();
